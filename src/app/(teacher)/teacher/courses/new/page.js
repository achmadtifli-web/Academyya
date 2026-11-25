import { ChevronLeft } from 'lucide-react';
import { requirePageUser } from '@/lib/pageAuth';
import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { CourseFormClient } from '@/components/teacher/CourseFormClient';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Buat Course Baru',
};

export default async function NewTeacherCoursePage() {
  const [user, categories] = await Promise.all([
    requirePageUser({ callbackUrl: '/teacher/courses/new', roles: ['teacher'] }),
    listCategoriesWithCounts(),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button href="/teacher/courses" variant="ghost" size="sm" className="-ml-2 mb-3">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Course</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Buat Course Baru
        </h1>
        <p className="text-muted mt-1">
          Course baru akan disimpan sebagai draft agar Anda dapat menyusun materinya terlebih dahulu.
        </p>
      </div>

      <CourseFormClient categories={categories} teacherName={user.name} />
    </div>
  );
}
