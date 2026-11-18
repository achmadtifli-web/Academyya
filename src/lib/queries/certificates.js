import { query } from '@/lib/db';

export async function listStudentCertificates(studentId) {
  const res = await query(
    `SELECT
       cert.id,
       cert.certificate_code,
       cert.issued_at,
       c.id AS course_id,
       c.title AS course_title,
       c.slug AS course_slug,
       c.level,
       cat.name AS category_name,
       t.name AS teacher_name
     FROM certificates cert
     JOIN enrollments e ON e.id = cert.enrollment_id
     JOIN courses c ON c.id = e.course_id
     JOIN categories cat ON cat.id = c.category_id
     JOIN users t ON t.id = c.teacher_id
     WHERE e.student_id = $1
     ORDER BY cert.issued_at DESC`,
    [studentId]
  );
  return res.rows;
}

export async function getCertificateByCode(code) {
  const res = await query(
    `SELECT
       cert.id,
       cert.certificate_code,
       cert.issued_at,
       e.completed_at,
       s.id AS student_id,
       s.name AS student_name,
       c.id AS course_id,
       c.title AS course_title,
       c.slug AS course_slug,
       c.level,
       cat.name AS category_name,
       t.name AS teacher_name,
       (SELECT COUNT(*)::int FROM materials m WHERE m.course_id = c.id) AS total_materials,
       (SELECT COALESCE(SUM(m.duration_minutes), 0)::int FROM materials m WHERE m.course_id = c.id) AS total_duration
     FROM certificates cert
     JOIN enrollments e ON e.id = cert.enrollment_id
     JOIN users s ON s.id = e.student_id
     JOIN courses c ON c.id = e.course_id
     JOIN categories cat ON cat.id = c.category_id
     JOIN users t ON t.id = c.teacher_id
     WHERE UPPER(TRIM(cert.certificate_code)) = UPPER(TRIM($1))
       AND e.status = 'completed'
     LIMIT 1`,
    [code]
  );
  return res.rows[0] || null;
}
