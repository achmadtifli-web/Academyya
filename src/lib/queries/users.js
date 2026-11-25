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
           SELECT id, expertise, motivation, portfolio_url, cv_url, status, review_note, reviewed_at, created_at
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
  cvUrl,
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
      `INSERT INTO teacher_applications (user_id, expertise, motivation, portfolio_url, cv_url, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [newUser.id, expertise, motivation || null, portfolioUrl || null, cvUrl || null]
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
    `SELECT ta.id, ta.expertise, ta.motivation, ta.portfolio_url, ta.cv_url, ta.status,
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

export async function createTeacherApplication({
  userId,
  expertise,
  motivation,
  portfolioUrl,
  cvUrl,
}) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existingApps = await client.query(
      `SELECT status FROM teacher_applications WHERE user_id = $1`,
      [userId]
    );
    if (existingApps.rowCount === 0) {
      const err = new Error('REGISTRATION_ONLY');
      err.code = 'REGISTRATION_ONLY';
      throw err;
    }
    if (existingApps.rows.some((row) => row.status === 'pending')) {
      const err = new Error('ALREADY_PENDING');
      err.code = 'ALREADY_PENDING';
      throw err;
    }

    const insertRes = await client.query(
      `INSERT INTO teacher_applications (user_id, expertise, motivation, portfolio_url, cv_url, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, user_id, expertise, motivation, portfolio_url, cv_url, status, created_at`,
      [userId, expertise, motivation || null, portfolioUrl || null, cvUrl || null]
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

export async function listTeachersForSelect() {
  const res = await query(
    `SELECT id, name, email
     FROM users
     WHERE role = 'teacher'
     ORDER BY name ASC`
  );
  return res.rows;
}

export async function findTeacherById(teacherId) {
  const res = await query(
    `SELECT id, name, email, role
     FROM users
     WHERE id = $1 AND role = 'teacher'
     LIMIT 1`,
    [teacherId]
  );
  return res.rows[0] || null;
}

export async function listAdminUsers({
  q = null,
  role = null,
  filter = null,
  page = 1,
  limit = 5,
} = {}) {
  const cleanQ = q && String(q).trim() ? String(q).trim() : null;
  const rawFilter = filter || role || 'all';
  const cleanFilter = ['pending', 'admin', 'teacher', 'student'].includes(rawFilter)
    ? rawFilter
    : 'all';
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
  const requestedPage = Math.max(Number(page) || 1, 1);

  const pendingSubquery = `
    LEFT JOIN LATERAL (
      SELECT id, expertise, motivation, portfolio_url, cv_url, created_at
      FROM teacher_applications
      WHERE user_id = u.id AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    ) pending_ta ON TRUE
  `;

  const whereSql = `
    WHERE ($1::text IS NULL OR u.name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
      AND (
        $2::text = 'all'
        OR ($2::text = 'pending' AND pending_ta.id IS NOT NULL)
        OR ($2::text IN ('admin', 'teacher', 'student') AND u.role = $2::text)
      )
  `;

  const countRes = await query(
    `SELECT
       COUNT(*)::int AS total,
       (SELECT COUNT(DISTINCT user_id)::int FROM teacher_applications WHERE status = 'pending') AS pending_teacher_count
     FROM users u
     ${pendingSubquery}
     ${whereSql}`,
    [cleanQ, cleanFilter]
  );

  const total = countRes.rows[0]?.total || 0;
  const pendingTeacherCount = countRes.rows[0]?.pending_teacher_count || 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(requestedPage, totalPages);
  const offset = (safePage - 1) * safeLimit;

  const res = await query(
    `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.approved_at, u.created_at,
            pending_ta.id AS pending_teacher_application_id,
            pending_ta.expertise AS pending_teacher_expertise,
            pending_ta.motivation AS pending_teacher_motivation,
            pending_ta.portfolio_url AS pending_teacher_portfolio_url,
            pending_ta.cv_url AS pending_teacher_cv_url,
            pending_ta.created_at AS pending_teacher_requested_at,
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
     ${pendingSubquery}
     LEFT JOIN courses c ON c.teacher_id = u.id
     LEFT JOIN enrollments e ON e.student_id = u.id
     ${whereSql}
     GROUP BY u.id, pending_ta.id, pending_ta.expertise, pending_ta.motivation, pending_ta.portfolio_url, pending_ta.cv_url, pending_ta.created_at
     ORDER BY CASE WHEN pending_ta.id IS NOT NULL THEN 0 ELSE 1 END, u.created_at DESC, u.id DESC
     LIMIT $3 OFFSET $4`,
    [cleanQ, cleanFilter, safeLimit, offset]
  );

  return {
    users: res.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
    pendingTeacherCount,
  };
}

export async function createUserByAdmin({ name, email, passwordHash, role }) {
  const res = await query(
    `INSERT INTO users (name, email, password_hash, role, approved_at)
     VALUES ($1, LOWER(TRIM($2)), $3, $4::varchar, CASE WHEN $4::varchar = 'teacher' THEN NOW() ELSE NULL END)
     RETURNING id, name, email, role, avatar_url, approved_at, created_at`,
    [name, email, passwordHash, role]
  );
  return res.rows[0];
}

export async function updateUserByAdmin(
  targetUserId,
  { name, email, passwordHash = null, role, adminId = null }
) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const lockRes = await client.query(
      `SELECT id, role, approved_at
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [targetUserId]
    );
    const existing = lockRes.rows[0];
    if (!existing) {
      await client.query('COMMIT');
      return { status: 'NOT_FOUND' };
    }

    const updateRes = passwordHash
      ? await client.query(
          `UPDATE users
           SET name = $1,
               email = LOWER(TRIM($2)),
               password_hash = $3,
               role = $4::varchar,
               approved_at = CASE WHEN $4::varchar = 'teacher' THEN COALESCE(approved_at, NOW()) ELSE NULL END
           WHERE id = $5
           RETURNING id, name, email, role, avatar_url, approved_at, created_at`,
          [name, email, passwordHash, role, targetUserId]
        )
      : await client.query(
          `UPDATE users
           SET name = $1,
               email = LOWER(TRIM($2)),
               role = $3::varchar,
               approved_at = CASE WHEN $3::varchar = 'teacher' THEN COALESCE(approved_at, NOW()) ELSE NULL END
           WHERE id = $4
           RETURNING id, name, email, role, avatar_url, approved_at, created_at`,
          [name, email, role, targetUserId]
        );

    if (role === 'teacher') {
      const pendingSync = await client.query(
        `UPDATE teacher_applications
         SET status = 'approved',
             reviewed_by = COALESCE($1::bigint, reviewed_by),
             review_note = COALESCE(review_note, 'Disetujui oleh Admin melalui pengelolaan pengguna.'),
             reviewed_at = NOW()
         WHERE user_id = $2 AND status = 'pending'
         RETURNING id`,
        [adminId, targetUserId]
      );

      if (pendingSync.rowCount > 0) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message)
           VALUES ($1, 'Pengajuan Teacher Disetujui', 'Selamat! Akun Anda kini aktif sebagai Teacher dan dapat mulai membuat course.')`,
          [targetUserId]
        );
      }
    }

    await client.query('COMMIT');
    return { status: 'UPDATED', user: updateRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
    `SELECT ta.id, ta.user_id, ta.expertise, ta.motivation, ta.portfolio_url, ta.cv_url,
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
        `UPDATE users SET role = 'teacher', approved_at = NOW() WHERE id = $1`,
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
