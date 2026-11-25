import { query, getClient } from '@/lib/db';

export async function listMaterialsForCourse(courseId) {
  const res = await query(
    `SELECT id, course_id, title, content, video_url, position, duration_minutes, created_at
     FROM materials
     WHERE course_id = $1
     ORDER BY position ASC`,
    [courseId]
  );
  return res.rows;
}

export async function getMaterialWithCourse(materialId) {
  const res = await query(
    `SELECT m.id, m.course_id, m.title, m.content, m.video_url, m.position, m.duration_minutes,
            c.teacher_id, c.slug AS course_slug, c.title AS course_title, c.status AS course_status,
            c.finalized_at AS course_finalized_at
     FROM materials m
     JOIN courses c ON c.id = m.course_id
     WHERE m.id = $1
     LIMIT 1`,
    [materialId]
  );
  return res.rows[0] || null;
}

export async function addMaterialToCourse(courseId, { title, content, video_url, duration_minutes }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const posRes = await client.query(
      `SELECT COALESCE(MAX(position), 0)::int + 1 AS next_pos
       FROM materials
       WHERE course_id = $1`,
      [courseId]
    );
    const nextPos = posRes.rows[0].next_pos;

    const insertRes = await client.query(
      `INSERT INTO materials (course_id, title, content, video_url, position, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, course_id, title, content, video_url, position, duration_minutes, created_at`,
      [courseId, title, content, video_url, nextPos, duration_minutes]
    );

    await client.query(`UPDATE courses SET updated_at = NOW() WHERE id = $1`, [courseId]);

    const courseRes = await client.query(
      `SELECT title, status
       FROM courses
       WHERE id = $1
       LIMIT 1`,
      [courseId]
    );
    const courseInfo = courseRes.rows[0];

    if (courseInfo?.status === 'published') {
      const completedTitle = 'Materi Baru Ditambahkan';
      const completedMessage = `Pengajar menambahkan materi baru "${title}" di course "${courseInfo.title}". Sertifikat Anda tetap sah dan aktif, dan Anda dapat mempelajari materi tambahan ini kapan saja.`;
      const activeTitle = 'Materi Baru Tersedia';
      const activeMessage = `Materi baru "${title}" telah ditambahkan ke course "${courseInfo.title}". Lanjutkan belajar untuk menyelesaikannya.`;

      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         SELECT
           e.student_id,
           CASE WHEN cert.id IS NOT NULL OR e.status = 'completed' THEN $2::varchar ELSE $3::varchar END,
           CASE WHEN cert.id IS NOT NULL OR e.status = 'completed' THEN $4::text ELSE $5::text END
         FROM enrollments e
         LEFT JOIN certificates cert ON cert.enrollment_id = e.id
         WHERE e.course_id = $1`,
        [courseId, completedTitle, activeTitle, completedMessage, activeMessage]
      );
    }

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateMaterialById(
  materialId,
  { title, content, video_url, duration_minutes, position = null }
) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const curRes = await client.query(
      `SELECT id, course_id, position
       FROM materials
       WHERE id = $1
       FOR UPDATE`,
      [materialId]
    );
    const current = curRes.rows[0];
    if (!current) {
      await client.query('COMMIT');
      return null;
    }

    if (position !== null && position !== undefined) {
      const countRes = await client.query(
        `SELECT COUNT(*)::int AS total FROM materials WHERE course_id = $1`,
        [current.course_id]
      );
      const total = countRes.rows[0]?.total || 1;
      const targetPos = Math.max(1, Math.min(total, Number(position)));

      if (targetPos < current.position) {
        await client.query(
          `UPDATE materials
           SET position = position + 1
           WHERE course_id = $1 AND position >= $2 AND position < $3`,
          [current.course_id, targetPos, current.position]
        );
      } else if (targetPos > current.position) {
        await client.query(
          `UPDATE materials
           SET position = position - 1
           WHERE course_id = $1 AND position > $2 AND position <= $3`,
          [current.course_id, current.position, targetPos]
        );
      }

      await client.query(
        `UPDATE materials
         SET title = $1, content = $2, video_url = $3, duration_minutes = $4, position = $5
         WHERE id = $6`,
        [title, content, video_url, duration_minutes, targetPos, materialId]
      );
    } else {
      await client.query(
        `UPDATE materials
         SET title = $1, content = $2, video_url = $3, duration_minutes = $4
         WHERE id = $5`,
        [title, content, video_url, duration_minutes, materialId]
      );
    }

    await client.query(`UPDATE courses SET updated_at = NOW() WHERE id = $1`, [
      current.course_id,
    ]);

    const updatedRes = await client.query(
      `SELECT id, course_id, title, content, video_url, position, duration_minutes, created_at
       FROM materials
       WHERE id = $1`,
      [materialId]
    );

    const listRes = await client.query(
      `SELECT id, course_id, title, content, video_url, position, duration_minutes, created_at
       FROM materials
       WHERE course_id = $1
       ORDER BY position ASC`,
      [current.course_id]
    );

    await client.query('COMMIT');
    return {
      material: updatedRes.rows[0] || null,
      materials: listRes.rows,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Transaction D: Reorder all materials in a course atomically.
 * Works cleanly because uq_materials_course_position is DEFERRABLE INITIALLY DEFERRED.
 */
export async function reorderCourseMaterials(courseId, orderedIds) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < orderedIds.length; i += 1) {
      await client.query(
        `UPDATE materials
         SET position = $1
         WHERE id = $2 AND course_id = $3`,
        [i + 1, orderedIds[i], courseId]
      );
    }

    await client.query(`UPDATE courses SET updated_at = NOW() WHERE id = $1`, [courseId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Transaction E: Delete a material and compact remaining positions sequentially (1..N).
 */
export async function deleteMaterialAndCompact(materialId, courseId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const delRes = await client.query(
      `DELETE FROM materials WHERE id = $1 AND course_id = $2 RETURNING id`,
      [materialId, courseId]
    );
    if (delRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      `WITH reordered AS (
         SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC) AS new_pos
         FROM materials
         WHERE course_id = $1
       )
       UPDATE materials m
       SET position = r.new_pos
       FROM reordered r
       WHERE m.id = r.id`,
      [courseId]
    );

    await client.query(`UPDATE courses SET updated_at = NOW() WHERE id = $1`, [courseId]);
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Resolve learning workspace context for /learn/[course]/[materi].
 */
export async function getLearningWorkspaceData(courseSlug, materialIdParam, currentUser) {
  const courseRes = await query(
    `SELECT c.id, c.teacher_id, c.title, c.slug, c.level, c.status, c.finalized_at,
            u.name AS teacher_name, cat.name AS category_name
     FROM courses c
     JOIN users u ON u.id = c.teacher_id
     JOIN categories cat ON cat.id = c.category_id
     WHERE c.slug = $1
     LIMIT 1`,
    [courseSlug]
  );
  const course = courseRes.rows[0];
  if (!course) return { status: 'NOT_FOUND' };

  const isTeacherOwner =
    currentUser.role === 'teacher' && Number(course.teacher_id) === Number(currentUser.id);
  const isAdmin = currentUser.role === 'admin';

  if (course.status !== 'published' && !isTeacherOwner && !isAdmin) {
    return { status: 'FORBIDDEN' };
  }

  let enrollment = null;
  if (currentUser.role === 'student') {
    const enrollRes = await query(
      `SELECT e.id, e.status, e.enrolled_at, e.completed_at, cert.certificate_code
       FROM enrollments e
       LEFT JOIN certificates cert ON cert.enrollment_id = e.id
       WHERE e.student_id = $1 AND e.course_id = $2
       LIMIT 1`,
      [currentUser.id, course.id]
    );
    enrollment = enrollRes.rows[0] || null;
    if (!enrollment) {
      return { status: 'NOT_ENROLLED', course };
    }
  } else if (!isTeacherOwner && !isAdmin) {
    return { status: 'FORBIDDEN' };
  }

  const materialsRes = await query(
    `SELECT m.id, m.title, m.content, m.video_url, m.position, m.duration_minutes,
            CASE
              WHEN $1::bigint IS NOT NULL THEN COALESCE(mp.is_completed, FALSE)
              ELSE FALSE
            END AS is_completed
     FROM materials m
     LEFT JOIN material_progress mp
       ON mp.material_id = m.id AND mp.enrollment_id = $1
     WHERE m.course_id = $2
     ORDER BY m.position ASC`,
    [enrollment?.id || null, course.id]
  );

  const materials = materialsRes.rows;
  const totalMaterials = materials.length;
  const completedMaterials = materials.filter((item) => item.is_completed).length;
  const progressPercent =
    totalMaterials > 0 ? Math.round((100 * completedMaterials) / totalMaterials) : 0;

  let activeMaterial = null;
  if (materialIdParam) {
    activeMaterial = materials.find((item) => Number(item.id) === Number(materialIdParam)) || null;
  } else {
    activeMaterial = materials.find((item) => !item.is_completed) || materials[0] || null;
  }

  return {
    status: 'OK',
    course,
    enrollment,
    isPreviewMode: !enrollment,
    materials,
    activeMaterial,
    progress: {
      total_materials: totalMaterials,
      completed_materials: completedMaterials,
      progress_percent: progressPercent,
    },
  };
}
