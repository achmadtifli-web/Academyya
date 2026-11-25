import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { requirePageUser } from '@/lib/pageAuth';
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
    requirePageUser({ callbackUrl: `/teacher/courses/${courseId}/edit` }),
    getCourseById(courseId),
    listCategoriesWithCounts(),
  ]);

  if (!course) notFound();
  if (user.role !== 'admin' && Number(course.teacher_id) !== Number(user.id)) {
    redirect('/403');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button href="/teacher/courses" variant="ghost" size="sm" className="-ml-2 mb-3">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Course</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Edit Informasi Course
        </h1>
        <p className="text-muted mt-1">
          Perbarui judul, kategori, tingkat kesulitan, atau deskripsi course Anda.
        </p>
      </div>

      <CourseFormClient
        categories={categories}
        initialCourse={course}
        teacherName={course.teacher_name || user.name}
      />
    </div>
  );
}
