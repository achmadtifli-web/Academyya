import { ChevronLeft } from 'lucide-react';
import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { CourseFormClient } from '@/components/teacher/CourseFormClient';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Buat Course Baru',
};

export default async function NewTeacherCoursePage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div className="space-y-6">
      <div>
        <Button href="/teacher/courses" variant="outline" size="sm">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Course</span>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Buat Course Baru</h1>
        <p className="text-base text-muted">
          Course baru akan disimpan sebagai draft agar Anda dapat menyusun materinya terlebih dahulu.
        </p>
      </div>

      <CourseFormClient categories={categories} />
    </div>
  );
}
