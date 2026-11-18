import { query } from '@/lib/db';

/**
 * Verify BR-10: user must be an enrolled Student of the material's course,
 * the owning Teacher, or an Admin.
 */
export async function canAccessMaterialDiscussion(materialId, currentUser) {
  const res = await query(
    `SELECT m.id AS material_id, m.course_id, c.teacher_id, c.status AS course_status,
            EXISTS (
              SELECT 1 FROM enrollments e
              WHERE e.course_id = c.id AND e.student_id = $2
            ) AS is_enrolled
     FROM materials m
     JOIN courses c ON c.id = m.course_id
     WHERE m.id = $1
     LIMIT 1`,
    [materialId, currentUser.id]
  );

  const row = res.rows[0];
  if (!row) return { exists: false, allowed: false };

  const isAdmin = currentUser.role === 'admin';
  const isOwner = Number(row.teacher_id) === Number(currentUser.id);
  const isEnrolledStudent = currentUser.role === 'student' && row.is_enrolled;

  return {
    exists: true,
    allowed: isAdmin || isOwner || isEnrolledStudent,
    courseId: row.course_id,
  };
}

export async function listMaterialDiscussionsTree(materialId) {
  const res = await query(
    `SELECT
       d.id,
       d.material_id,
       d.user_id,
       d.parent_id,
       d.content,
       d.created_at,
       u.name AS author_name,
       u.role AS author_role,
       u.avatar_url AS author_avatar
     FROM discussions d
     JOIN users u ON u.id = d.user_id
     WHERE d.material_id = $1
     ORDER BY d.created_at ASC`,
    [materialId]
  );

  const roots = [];
  const replyMap = new Map();

  for (const row of res.rows) {
    if (row.parent_id === null) {
      roots.push({ ...row, replies: [] });
    } else {
      const parentKey = String(row.parent_id);
      if (!replyMap.has(parentKey)) replyMap.set(parentKey, []);
      replyMap.get(parentKey).push(row);
    }
  }

  for (const root of roots) {
    root.replies = replyMap.get(String(root.id)) || [];
  }

  // Show newest root questions first while keeping chronological order for replies.
  roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return roots;
}

export async function createDiscussionPost({ materialId, userId, parentId = null, content }) {
  if (parentId !== null) {
    const parentRes = await query(
      `SELECT id FROM discussions WHERE id = $1 AND material_id = $2 AND parent_id IS NULL LIMIT 1`,
      [parentId, materialId]
    );
    if (parentRes.rowCount === 0) {
      const err = new Error('PARENT_NOT_FOUND');
      err.code = 'PARENT_NOT_FOUND';
      throw err;
    }
  }

  const insertRes = await query(
    `INSERT INTO discussions (material_id, user_id, parent_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, material_id, user_id, parent_id, content, created_at`,
    [materialId, userId, parentId, content]
  );

  const created = insertRes.rows[0];
  const userRes = await query(
    `SELECT name AS author_name, role AS author_role, avatar_url AS author_avatar
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  return {
    ...created,
    ...userRes.rows[0],
    replies: [],
  };
}
