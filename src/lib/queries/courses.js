import { query } from '@/lib/db';
import { slugify } from '@/lib/validators';

export async function getPlatformStats() {
  const res = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM courses WHERE status = 'published') AS total_courses,
       (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
       (SELECT COUNT(*)::int FROM users WHERE role = 'teacher') AS total_teachers`
  );
  return res.rows[0] || { total_courses: 0, total_students: 0, total_teachers: 0 };
}

export async function listPopularCourses(limit = 4) {
  const res = await query(
    `SELECT c.id, c.title, c.slug, c.description, c.level, c.thumbnail_url, c.created_at,
            u.id AS teacher_id, u.name AS teacher_name, u.avatar_url AS teacher_avatar,
            cat.id AS category_id, cat.name AS category_name, cat.slug AS category_slug, cat.icon AS category_icon,
            COUNT(DISTINCT m.id)::int AS total_materials,
            COALESCE(SUM(m.duration_minutes), 0)::int AS total_duration,
            COUNT(DISTINCT e.id)::int AS total_students
     FROM courses c
     JOIN users u ON u.id = c.teacher_id
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN materials m ON m.course_id = c.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE c.status = 'published'
     GROUP BY c.id, u.id, u.name, u.avatar_url, cat.id, cat.name, cat.slug, cat.icon
     ORDER BY COUNT(DISTINCT e.id) DESC, c.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}

export async function searchCatalogCourses({
  q = null,
  category = null,
  level = null,
  sort = 'newest',
  page = 1,
  limit = 12,
} = {}) {
  const cleanQ = q && String(q).trim() ? String(q).trim() : null;
  const cleanCategory = category && String(category).trim() ? String(category).trim() : null;
  const cleanLevel = ['pemula', 'menengah', 'lanjut'].includes(level) ? level : null;
  const cleanSort = sort === 'popular' ? 'popular' : 'newest';
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(24, Math.max(1, Number(limit) || 12));
  const offset = (safePage - 1) * safeLimit;

  const res = await query(
    `SELECT
       c.id, c.title, c.slug, c.description, c.level, c.thumbnail_url, c.created_at,
       u.id AS teacher_id, u.name AS teacher_name, u.avatar_url AS teacher_avatar,
       cat.id AS category_id, cat.name AS category_name, cat.slug AS category_slug, cat.icon AS category_icon,
       COUNT(DISTINCT m.id)::int AS total_materials,
       COALESCE(SUM(m.duration_minutes), 0)::int AS total_duration,
       COUNT(DISTINCT e.id)::int AS total_students,
       COUNT(*) OVER()::int AS full_count
     FROM courses c
     JOIN users u ON u.id = c.teacher_id
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN materials m ON m.course_id = c.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE c.status = 'published'
       AND ($1::text IS NULL OR c.title ILIKE '%' || $1 || '%' OR c.description ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR cat.slug = $2)
       AND ($3::text IS NULL OR c.level = $3)
     GROUP BY c.id, u.id, u.name, u.avatar_url, cat.id, cat.name, cat.slug, cat.icon
     ORDER BY
       CASE WHEN $4 = 'popular' THEN COUNT(DISTINCT e.id) END DESC NULLS LAST,
       c.created_at DESC
     LIMIT $5 OFFSET $6`,
    [cleanQ, cleanCategory, cleanLevel, cleanSort, safeLimit, offset]
  );

  const total = res.rows[0]?.full_count || 0;
  const courses = res.rows.map(({ full_count, ...row }) => row);

  return {
    courses,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export async function getCourseDetailBySlug(slug, currentUser = null) {
  const courseRes = await query(
    `SELECT c.id, c.teacher_id, c.category_id, c.title, c.slug, c.description,
            c.thumbnail_url, c.level, c.status, c.created_at, c.updated_at,
            u.name AS teacher_name, u.avatar_url AS teacher_avatar, u.bio AS teacher_bio,
            cat.name AS category_name, cat.slug AS category_slug,
            COUNT(DISTINCT e.id)::int AS total_students
     FROM courses c
     JOIN users u ON u.id = c.teacher_id
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE c.slug = $1
     GROUP BY c.id, u.name, u.avatar_url, u.bio, cat.name, cat.slug
     LIMIT 1`,
    [slug]
  );

  const course = courseRes.rows[0];
  if (!course) return null;

  const isOwnerOrAdmin =
    currentUser &&
    (currentUser.role === 'admin' || Number(currentUser.id) === Number(course.teacher_id));

  // Enforce BR-04: draft courses are hidden unless viewed by owner Teacher or Admin.
  if (course.status !== 'published' && !isOwnerOrAdmin) {
    return null;
  }

  let enrollment = null;
  if (currentUser && currentUser.role === 'student') {
    const enrollRes = await query(
      `SELECT e.id, e.status, e.enrolled_at, e.completed_at,
              cert.certificate_code
       FROM enrollments e
       LEFT JOIN certificates cert ON cert.enrollment_id = e.id
       WHERE e.student_id = $1 AND e.course_id = $2
       LIMIT 1`,
      [currentUser.id, course.id]
    );
    enrollment = enrollRes.rows[0] || null;
  }

  // Only reveal material content/video in syllabus query when not locked, or return metadata only here.
  const materialsRes = await query(
    `SELECT m.id, m.title, m.position, m.duration_minutes,
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
  const totalDuration = materials.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
  const completedMaterials = materials.filter((item) => item.is_completed).length;
  const progressPercent =
    totalMaterials > 0 ? Math.round((100 * completedMaterials) / totalMaterials) : 0;

  return {
    course: {
      ...course,
      total_materials: totalMaterials,
      total_duration: totalDuration,
    },
    materials,
    enrollment: enrollment
      ? {
          ...enrollment,
          completed_materials: completedMaterials,
          total_materials: totalMaterials,
          progress_percent: progressPercent,
        }
      : null,
  };
}

async function generateUniqueCourseSlug(title, excludeId = null) {
  const baseSlug = slugify(title) || 'course';
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const res = await query(
      `SELECT id FROM courses WHERE slug = $1 AND ($2::bigint IS NULL OR id <> $2) LIMIT 1`,
      [candidate, excludeId]
    );
    if (res.rowCount === 0) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function listTeacherCourses(teacherId) {
  const res = await query(
    `SELECT c.id, c.teacher_id, c.category_id, c.title, c.slug, c.description,
            c.thumbnail_url, c.level, c.status, c.created_at, c.updated_at,
            cat.name AS category_name,
            COUNT(DISTINCT m.id)::int AS total_materials,
            COALESCE(SUM(m.duration_minutes), 0)::int AS total_duration,
            COUNT(DISTINCT e.id)::int AS total_students
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN materials m ON m.course_id = c.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE c.teacher_id = $1
     GROUP BY c.id, cat.name
     ORDER BY c.updated_at DESC, c.created_at DESC`,
    [teacherId]
  );
  return res.rows;
}

export async function getCourseById(courseId) {
  const res = await query(
    `SELECT c.id, c.teacher_id, c.category_id, c.title, c.slug, c.description,
            c.thumbnail_url, c.level, c.status, c.created_at, c.updated_at,
            cat.name AS category_name, u.name AS teacher_name,
            (SELECT COUNT(*)::int FROM materials m WHERE m.course_id = c.id) AS total_materials
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     JOIN users u ON u.id = c.teacher_id
     WHERE c.id = $1
     LIMIT 1`,
    [courseId]
  );
  return res.rows[0] || null;
}

export async function createTeacherCourse({
  teacherId,
  title,
  description,
  category_id,
  level,
  thumbnail_url,
}) {
  const slug = await generateUniqueCourseSlug(title);
  const res = await query(
    `INSERT INTO courses (teacher_id, category_id, title, slug, description, thumbnail_url, level, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
     RETURNING id, teacher_id, category_id, title, slug, description, thumbnail_url, level, status, created_at, updated_at`,
    [teacherId, category_id, title, slug, description, thumbnail_url, level]
  );
  return res.rows[0];
}

export async function updateCourseDetails(courseId, fields) {
  const existing = await getCourseById(courseId);
  if (!existing) return null;

  const nextTitle = fields.title ?? existing.title;
  const nextSlug =
    fields.title && fields.title !== existing.title
      ? await generateUniqueCourseSlug(nextTitle, courseId)
      : existing.slug;

  const res = await query(
    `UPDATE courses
     SET title = $1,
         slug = $2,
         description = $3,
         category_id = $4,
         level = $5,
         thumbnail_url = $6,
         status = $7,
         updated_at = NOW()
     WHERE id = $8
     RETURNING id, teacher_id, category_id, title, slug, description, thumbnail_url, level, status, created_at, updated_at`,
    [
      nextTitle,
      nextSlug,
      fields.description ?? existing.description,
      fields.category_id ?? existing.category_id,
      fields.level ?? existing.level,
      fields.thumbnail_url !== undefined ? fields.thumbnail_url : existing.thumbnail_url,
      fields.status ?? existing.status,
      courseId,
    ]
  );
  return res.rows[0] || null;
}

export async function deleteCourseById(courseId) {
  const res = await query(
    `DELETE FROM courses WHERE id = $1 RETURNING id, title`,
    [courseId]
  );
  return res.rows[0] || null;
}

export async function listCoursesForAdmin({ q = null, status = null } = {}) {
  const cleanQ = q && q.trim() ? q.trim() : null;
  const cleanStatus = ['draft', 'published'].includes(status) ? status : null;

  const res = await query(
    `SELECT c.id, c.title, c.slug, c.level, c.status, c.created_at, c.updated_at,
            u.id AS teacher_id, u.name AS teacher_name, u.email AS teacher_email,
            cat.name AS category_name,
            COUNT(DISTINCT m.id)::int AS total_materials,
            COUNT(DISTINCT e.id)::int AS total_students
     FROM courses c
     JOIN users u ON u.id = c.teacher_id
     JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN materials m ON m.course_id = c.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE ($1::text IS NULL OR c.title ILIKE '%' || $1 || '%' OR u.name ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR c.status = $2)
     GROUP BY c.id, u.id, u.name, u.email, cat.name
     ORDER BY c.created_at DESC`,
    [cleanQ, cleanStatus]
  );
  return res.rows;
}

export async function getTeacherDashboardSummary(teacherId) {
  const res = await query(
    `SELECT
       COUNT(DISTINCT c.id)::int AS total_courses,
       COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published')::int AS published_courses,
       COUNT(DISTINCT e.id)::int AS total_enrollments,
       COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')::int AS completed_enrollments
     FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE c.teacher_id = $1`,
    [teacherId]
  );
  return res.rows[0];
}
