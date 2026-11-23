import { query, getClient } from '@/lib/db';

export async function findUserByEmail(email) {
  const res = await query(
    `SELECT id, name, email, password_hash, role, avatar_url, bio, created_at
     FROM users
     WHERE email = LOWER(TRIM($1))
     LIMIT 1`,
    [email]
  );
  return res.rows[0] || null;
}

export async function fetchFreshUserSessionProfile(userId) {
  const res = await query(
    `SELECT
       u.id, u.name, u.email, u.role, u.avatar_url, u.bio, u.created_at,
       (
         SELECT row_to_json(ta)
         FROM (
           SELECT id, expertise, motivation, portfolio_url, status, review_note, reviewed_at, created_at
           FROM teacher_applications
           WHERE user_id = u.id
           ORDER BY created_at DESC
           LIMIT 1
         ) ta
       ) AS latest_teacher_application,
       (
         SELECT COUNT(*)::int
         FROM notifications n
         WHERE n.user_id = u.id AND n.is_read = FALSE
       ) AS unread_notifications,
       CASE
         WHEN u.role = 'admin' THEN (
           SELECT COUNT(*)::int
           FROM teacher_applications
           WHERE status = 'pending'
         )
         ELSE 0
       END AS pending_teacher_requests
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );
  return res.rows[0] || null;
}

export async function createStudentUser({ name, email, passwordHash }) {
  const res = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, LOWER(TRIM($2)), $3, 'student')
     RETURNING id, name, email, role, avatar_url, bio, created_at`,
    [name, email, passwordHash]
  );
  return res.rows[0];
}

/**
 * Create a Teacher applicant inside an explicit SQL transaction.
 * Per BR-02, the user starts as 'student' until Admin approves their request.
 */
export async function createTeacherApplicant({
  name,
  email,
  passwordHash,
  expertise,
  motivation,
  portfolioUrl,
}) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, LOWER(TRIM($2)), $3, 'student')
       RETURNING id, name, email, role, avatar_url, bio, created_at`,
      [name, email, passwordHash]
    );
    const newUser = userRes.rows[0];

    await client.query(
      `INSERT INTO teacher_applications (user_id, expertise, motivation, portfolio_url, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [newUser.id, expertise, motivation || null, portfolioUrl || null]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, 'Pengajuan Teacher Diterima Sistem', 'Terima kasih telah mendaftar sebagai Teacher. Pengajuan Anda sedang ditinjau oleh Admin.')`,
      [newUser.id]
    );

    await client.query('COMMIT');
    return newUser;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateUserProfile(userId, { name, bio, avatarUrl, passwordHash }) {
  if (passwordHash) {
    const res = await query(
      `UPDATE users
       SET name = $1, bio = $2, avatar_url = $3, password_hash = $4
       WHERE id = $5
       RETURNING id, name, email, role, avatar_url, bio, created_at`,
      [name, bio || null, avatarUrl || null, passwordHash, userId]
    );
    return res.rows[0] || null;
  }

  const res = await query(
    `UPDATE users
     SET name = $1, bio = $2, avatar_url = $3
     WHERE id = $4
     RETURNING id, name, email, role, avatar_url, bio, created_at`,
    [name, bio || null, avatarUrl || null, userId]
  );
  return res.rows[0] || null;
}

export async function getUserPasswordHash(userId) {
  const res = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
  return res.rows[0]?.password_hash || null;
}

export async function getUserTeacherApplications(userId) {
  const res = await query(
    `SELECT ta.id, ta.expertise, ta.motivation, ta.portfolio_url, ta.status,
            ta.review_note, ta.reviewed_at, ta.created_at,
            reviewer.name AS reviewer_name
     FROM teacher_applications ta
     LEFT JOIN users reviewer ON reviewer.id = ta.reviewed_by
     WHERE ta.user_id = $1
     ORDER BY ta.created_at DESC`,
    [userId]
  );
  return res.rows;
}

export async function createTeacherApplication({ userId, expertise, motivation, portfolioUrl }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const pendingCheck = await client.query(
      `SELECT id FROM teacher_applications WHERE user_id = $1 AND status = 'pending' LIMIT 1`,
      [userId]
    );
    if (pendingCheck.rowCount > 0) {
      const err = new Error('ALREADY_PENDING');
      err.code = 'ALREADY_PENDING';
      throw err;
    }

    const insertRes = await client.query(
      `INSERT INTO teacher_applications (user_id, expertise, motivation, portfolio_url, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, user_id, expertise, motivation, portfolio_url, status, created_at`,
      [userId, expertise, motivation || null, portfolioUrl || null]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, 'Pengajuan Teacher Dikirim', 'Pengajuan baru Anda sedang menunggu verifikasi dari Admin.')`,
      [userId]
    );

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listAdminUsers({ q = null, role = null } = {}) {
  const cleanQ = q && q.trim() ? q.trim() : null;
  const cleanRole = role && ['admin', 'teacher', 'student'].includes(role) ? role : null;

  const res = await query(
    `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.created_at,
            COUNT(DISTINCT c.id)::int AS courses_count,
            COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published')::int AS published_courses_count,
            COUNT(DISTINCT e.id)::int AS enrollments_count,
            COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active')::int AS active_enrollments_count,
            (
              SELECT COUNT(*)::int
              FROM enrollments ce
              JOIN courses cc ON cc.id = ce.course_id
              WHERE cc.teacher_id = u.id AND ce.status = 'active'
            ) AS active_course_enrollments_count
     FROM users u
     LEFT JOIN courses c ON c.teacher_id = u.id
     LEFT JOIN enrollments e ON e.student_id = u.id
     WHERE ($1::text IS NULL OR u.name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR u.role = $2)
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    [cleanQ, cleanRole]
  );
  return res.rows;
}

export async function deleteUserByAdmin(targetUserId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      `SELECT id, name, email, role, avatar_url
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [targetUserId]
    );
    const targetUser = userRes.rows[0];
    if (!targetUser) {
      await client.query('COMMIT');
      return { status: 'NOT_FOUND' };
    }

    const depRes = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM enrollments WHERE student_id = $1 AND status = 'active') AS active_enrollments,
         (SELECT COUNT(*)::int FROM courses WHERE teacher_id = $1 AND status = 'published') AS published_courses,
         (
           SELECT COUNT(*)::int
           FROM enrollments e
           JOIN courses c ON c.id = e.course_id
           WHERE c.teacher_id = $1 AND e.status = 'active'
         ) AS active_course_enrollments`,
      [targetUserId]
    );
    const deps = depRes.rows[0];

    if (deps.active_enrollments > 0) {
      const err = new Error('USER_HAS_ACTIVE_ENROLLMENTS');
      err.code = 'USER_HAS_ACTIVE_ENROLLMENTS';
      err.role = targetUser.role;
      err.count = deps.active_enrollments;
      throw err;
    }

    if (deps.published_courses > 0 || deps.active_course_enrollments > 0) {
      const err = new Error('TEACHER_HAS_ACTIVE_COURSES');
      err.code = 'TEACHER_HAS_ACTIVE_COURSES';
      err.publishedCourses = deps.published_courses;
      err.activeCourseEnrollments = deps.active_course_enrollments;
      throw err;
    }

    const delRes = await client.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, name, email, role, avatar_url`,
      [targetUserId]
    );

    await client.query('COMMIT');
    return { status: 'DELETED', user: delRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getAdminStats() {
  const res = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM users) AS total_users,
       (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
       (SELECT COUNT(*)::int FROM users WHERE role = 'teacher') AS total_teachers,
       (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS total_admins,
       (SELECT COUNT(*)::int FROM courses WHERE status = 'published') AS published_courses,
       (SELECT COUNT(*)::int FROM courses WHERE status = 'draft') AS draft_courses,
       (SELECT COUNT(*)::int FROM enrollments) AS total_enrollments,
       (SELECT COUNT(*)::int FROM enrollments WHERE status = 'completed') AS completed_enrollments,
       (SELECT COUNT(*)::int FROM teacher_applications WHERE status = 'pending') AS pending_teacher_requests,
       (SELECT COUNT(*)::int FROM categories) AS total_categories`
  );
  return res.rows[0];
}

export async function listTeacherApplicationsForAdmin(status = 'all') {
  const filterStatus = ['pending', 'approved', 'rejected'].includes(status) ? status : null;
  const res = await query(
    `SELECT ta.id, ta.user_id, ta.expertise, ta.motivation, ta.portfolio_url,
            ta.status, ta.review_note, ta.reviewed_at, ta.created_at,
            u.name AS applicant_name, u.email AS applicant_email, u.avatar_url AS applicant_avatar,
            u.created_at AS applicant_joined_at, u.role AS current_user_role,
            r.name AS reviewer_name
     FROM teacher_applications ta
     JOIN users u ON u.id = ta.user_id
     LEFT JOIN users r ON r.id = ta.reviewed_by
     WHERE ($1::text IS NULL OR ta.status = $1)
     ORDER BY
       CASE WHEN ta.status = 'pending' THEN 0 ELSE 1 END,
       ta.created_at DESC`,
    [filterStatus]
  );
  return res.rows;
}

/**
 * Transaction B: Admin approves or rejects a pending Teacher application.
 */
export async function reviewTeacherApplication({ applicationId, adminId, action, reviewNote }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const nextStatus = action === 'approve' ? 'approved' : 'rejected';
    const appRes = await client.query(
      `UPDATE teacher_applications
       SET status = $1, reviewed_by = $2, review_note = $3, reviewed_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING id, user_id, status, review_note, reviewed_at`,
      [nextStatus, adminId, reviewNote || null, applicationId]
    );

    if (appRes.rowCount === 0) {
      const err = new Error('APPLICATION_NOT_PENDING');
      err.code = 'APPLICATION_NOT_PENDING';
      throw err;
    }

    const applicantUserId = appRes.rows[0].user_id;

    if (action === 'approve') {
      await client.query(
        `UPDATE users SET role = 'teacher' WHERE id = $1`,
        [applicantUserId]
      );
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         VALUES ($1, 'Pengajuan Teacher Disetujui', $2)`,
        [
          applicantUserId,
          reviewNote ||
            'Selamat! Akun Anda kini aktif sebagai Teacher dan dapat mulai membuat course.',
        ]
      );
    } else {
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         VALUES ($1, 'Pengajuan Teacher Ditolak', $2)`,
        [
          applicantUserId,
          reviewNote ||
            'Pengajuan Anda belum dapat disetujui. Silakan perbarui data dan ajukan kembali.',
        ]
      );
    }

    await client.query('COMMIT');
    return appRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
