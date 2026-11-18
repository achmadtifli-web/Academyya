import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourseById } from '@/lib/queries/courses';
import { listMaterialsForCourse } from '@/lib/queries/materials';
import { CourseMaterialsView } from '@/components/course/CourseMaterialsView';
import { parsePositiveInt } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Materi Course',
};

export default async function ManageMaterialsPage({ params }) {
  const { id } = await params;
  const courseId = parsePositiveInt(id);
  if (!courseId) notFound();

  const [user, course] = await Promise.all([getCurrentUser(), getCourseById(courseId)]);
  if (!course) notFound();
  if (Number(course.teacher_id) !== Number(user.id)) {
    redirect('/403');
  }

  const materials = await listMaterialsForCourse(courseId);

  return (
    <CourseMaterialsView
      course={course}
      materials={materials}
      backHref="/teacher/courses"
      backLabel="Kembali ke Daftar Course"
    />
  );
}
