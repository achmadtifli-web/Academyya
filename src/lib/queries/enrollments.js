import crypto from 'crypto';
import { query, getClient } from '@/lib/db';

export async function listStudentEnrollments(studentId) {
  const res = await query(
    `SELECT
       e.id AS enrollment_id,
       e.status AS enrollment_status,
       e.enrolled_at,
       e.completed_at,
       c.id AS course_id,
       c.title,
       c.slug,
       c.level,
       c.thumbnail_url,
       u.name AS teacher_name,
       u.avatar_url AS teacher_avatar,
       cat.name AS category_name,
       COUNT(DISTINCT m.id)::int AS total_materials,
       COUNT(DISTINCT mp.id) FILTER (WHERE mp.is_completed = TRUE)::int AS completed_materials,
       COALESCE(
         ROUND(
           100.0 * COUNT(DISTINCT mp.id) FILTER (WHERE mp.is_completed = TRUE)
           / NULLIF(COUNT(DISTINCT m.id), 0)
         )::int,
         0
       ) AS progress_percent,
       (
         SELECT m2.id
         FROM materials m2
         LEFT JOIN material_progress mp2
           ON mp2.material_id = m2.id AND mp2.enrollment_id = e.id AND mp2.is_completed = TRUE
         WHERE m2.course_id = c.id AND mp2.id IS NULL
         ORDER BY m2.position ASC
         LIMIT 1
       ) AS next_material_id,
       (
         SELECT m3.id
         FROM materials m3
         WHERE m3.course_id = c.id
         ORDER BY m3.position ASC
         LIMIT 1
       ) AS first_material_id,
       cert.certificate_code
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN users u ON u.id = c.teacher_id
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN materials m ON m.course_id = c.id
     LEFT JOIN material_progress mp ON mp.enrollment_id = e.id AND mp.material_id = m.id
     LEFT JOIN certificates cert ON cert.enrollment_id = e.id
     WHERE e.student_id = $1
     GROUP BY e.id, c.id, u.name, u.avatar_url, cat.name, cert.certificate_code
     ORDER BY e.enrolled_at DESC`,
    [studentId]
  );
  return res.rows;
}

export async function enrollStudentInCourse(studentId, courseId) {
  const courseRes = await query(
    `SELECT id, slug, title, status FROM courses WHERE id = $1 LIMIT 1`,
    [courseId]
  );
  const course = courseRes.rows[0];
  if (!course || course.status !== 'published') {
    const err = new Error('COURSE_NOT_AVAILABLE');
    err.code = 'COURSE_NOT_AVAILABLE';
    throw err;
  }

  const insertRes = await query(
    `INSERT INTO enrollments (student_id, course_id, status)
     VALUES ($1, $2, 'active')
     RETURNING id, student_id, course_id, status, enrolled_at`,
    [studentId, courseId]
  );
  return { enrollment: insertRes.rows[0], course };
}

function generateCertificateCode() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `ACAD-${year}-${suffix}`;
}

/**
 * Transaction C: Toggle material completion, recompute dynamic progress_percent,
 * and auto-issue or revert enrollment completion and certificate status.
 */
export async function toggleMaterialProgress({ studentId, courseId, materialId }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const enrollRes = await client.query(
      `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 LIMIT 1`,
      [studentId, courseId]
    );
    if (enrollRes.rowCount === 0) {
      const err = new Error('NOT_ENROLLED');
      err.code = 'NOT_ENROLLED';
      throw err;
    }
    const enrollmentId = enrollRes.rows[0].id;

    const matRes = await client.query(
      `SELECT id FROM materials WHERE id = $1 AND course_id = $2 LIMIT 1`,
      [materialId, courseId]
    );
    if (matRes.rowCount === 0) {
      const err = new Error('MATERIAL_NOT_FOUND');
      err.code = 'MATERIAL_NOT_FOUND';
      throw err;
    }

    const existing = await client.query(
      `SELECT id, is_completed
       FROM material_progress
       WHERE enrollment_id = $1 AND material_id = $2`,
      [enrollmentId, materialId]
    );

    let isCompleted = true;
    if (existing.rowCount === 0) {
      await client.query(
        `INSERT INTO material_progress (enrollment_id, material_id, is_completed, completed_at)
         VALUES ($1, $2, TRUE, NOW())`,
        [enrollmentId, materialId]
      );
    } else {
      isCompleted = !existing.rows[0].is_completed;
      await client.query(
        `UPDATE material_progress
         SET is_completed = $1, completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END
         WHERE id = $2`,
        [isCompleted, existing.rows[0].id]
      );
    }

    const progRes = await client.query(
      `SELECT
         COUNT(m.id)::int AS total_materials,
         COUNT(mp.id) FILTER (WHERE mp.is_completed = TRUE)::int AS completed_materials,
         COALESCE(
           ROUND(100.0 * COUNT(mp.id) FILTER (WHERE mp.is_completed = TRUE) / NULLIF(COUNT(m.id), 0))::int,
           0
         ) AS progress_percent
       FROM materials m
       LEFT JOIN material_progress mp
         ON mp.material_id = m.id AND mp.enrollment_id = $1
       WHERE m.course_id = $2`,
      [enrollmentId, courseId]
    );
    const { total_materials, completed_materials, progress_percent } = progRes.rows[0];

    let certificateCode = null;
    if (progress_percent === 100 && total_materials > 0) {
      await client.query(
        `UPDATE enrollments
         SET status = 'completed', completed_at = COALESCE(completed_at, NOW())
         WHERE id = $1`,
        [enrollmentId]
      );

      const generatedCode = generateCertificateCode();
      await client.query(
        `INSERT INTO certificates (enrollment_id, certificate_code)
         VALUES ($1, $2)
         ON CONFLICT (enrollment_id) DO NOTHING`,
        [enrollmentId, generatedCode]
      );

      const certRes = await client.query(
        `SELECT certificate_code FROM certificates WHERE enrollment_id = $1`,
        [enrollmentId]
      );
      certificateCode = certRes.rows[0]?.certificate_code || null;
    } else {
      await client.query(
        `UPDATE enrollments
         SET status = 'active', completed_at = NULL
         WHERE id = $1`,
        [enrollmentId]
      );
    }

    await client.query('COMMIT');
    return {
      is_completed: isCompleted,
      total_materials,
      completed_materials,
      progress_percent,
      course_completed: progress_percent === 100 && total_materials > 0,
      certificate_code: certificateCode,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listTeacherStudents(teacherId, courseId = null) {
  const res = await query(
    `SELECT
       e.id AS enrollment_id,
       e.status AS enrollment_status,
       e.enrolled_at,
       e.completed_at,
       s.id AS student_id,
       s.name AS student_name,
       s.email AS student_email,
       s.avatar_url AS student_avatar,
       c.id AS course_id,
       c.title AS course_title,
       c.slug AS course_slug,
       COUNT(DISTINCT m.id)::int AS total_materials,
       COUNT(DISTINCT mp.id) FILTER (WHERE mp.is_completed = TRUE)::int AS completed_materials,
       COALESCE(
         ROUND(
           100.0 * COUNT(DISTINCT mp.id) FILTER (WHERE mp.is_completed = TRUE)
           / NULLIF(COUNT(DISTINCT m.id), 0)
         )::int,
         0
       ) AS progress_percent
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN users s ON s.id = e.student_id
     LEFT JOIN materials m ON m.course_id = c.id
     LEFT JOIN material_progress mp ON mp.enrollment_id = e.id AND mp.material_id = m.id
     WHERE c.teacher_id = $1
       AND ($2::bigint IS NULL OR c.id = $2)
     GROUP BY e.id, s.id, s.name, s.email, s.avatar_url, c.id, c.title, c.slug
     ORDER BY e.enrolled_at DESC`,
    [teacherId, courseId]
  );
  return res.rows;
}
