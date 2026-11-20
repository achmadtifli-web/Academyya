import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { getCourseById } from '@/lib/queries/courses';
import { CourseFormClient } from '@/components/teacher/CourseFormClient';
import { Button } from '@/components/ui/Button';
import { parsePositiveInt } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Course',
};

export default async function EditTeacherCoursePage({ params }) {
  const { id } = await params;
  const courseId = parsePositiveInt(id);
  if (!courseId) notFound();

  const [user, course, categories] = await Promise.all([
    getCurrentUser(),
    getCourseById(courseId),
    listCategoriesWithCounts(),
  ]);

  if (!course) notFound();
  if (user.role !== 'admin' && Number(course.teacher_id) !== Number(user.id)) {
    redirect('/403');
  }

  return (
    <div className="space-y-6">
      <div>
        <Button href="/teacher/courses" variant="outline" size="sm">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Course</span>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Edit Informasi Course</h1>
        <p className="text-base text-muted">
          Perbarui judul, kategori, level, foto sampul, atau deskripsi kelas.
        </p>
      </div>

      <CourseFormClient categories={categories} initialCourse={course} />
    </div>
  );
}
