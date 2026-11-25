import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { requirePageUser } from '@/lib/pageAuth';
import { parsePositiveInt } from '@/lib/validators';
import { getCourseById } from '@/lib/queries/courses';
import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { listTeachersForSelect } from '@/lib/queries/users';
import { CourseFormClient } from '@/components/teacher/CourseFormClient';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Course - Admin',
};

export default async function EditAdminCoursePage({ params }) {
  const { id } = await params;
  const courseId = parsePositiveInt(id);
  if (!courseId) notFound();

  const [, course, categories, teachers] = await Promise.all([
    requirePageUser({ callbackUrl: `/admin/courses/${courseId}/edit`, roles: ['admin'] }),
    getCourseById(courseId),
    listCategoriesWithCounts(),
    listTeachersForSelect(),
  ]);

  if (!course) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button href="/admin/courses" variant="ghost" size="sm" className="-ml-2 mb-3">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Course</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Edit Informasi Course
        </h1>
        <p className="text-muted mt-1">{course.title}</p>
      </div>

      <CourseFormClient
        categories={categories}
        initialCourse={course}
        isAdmin
        teachers={teachers}
        cancelHref="/admin/courses"
      />
    </div>
  );
}
