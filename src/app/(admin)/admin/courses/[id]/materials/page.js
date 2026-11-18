import { notFound } from 'next/navigation';
import { getCourseById } from '@/lib/queries/courses';
import { listMaterialsForCourse } from '@/lib/queries/materials';
import { CourseMaterialsView } from '@/components/course/CourseMaterialsView';
import { parsePositiveInt } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Materi Course',
};

export default async function AdminManageMaterialsPage({ params }) {
  const { id } = await params;
  const courseId = parsePositiveInt(id);
  if (!courseId) notFound();

  const course = await getCourseById(courseId);
  if (!course) notFound();

  const materials = await listMaterialsForCourse(courseId);

  return (
    <CourseMaterialsView
      course={course}
      materials={materials}
      backHref="/admin/courses"
      backLabel="Kembali ke Moderasi Course"
      showTeacher
    />
  );
}
