import { ChevronLeft } from 'lucide-react';
import { requirePageUser } from '@/lib/pageAuth';
import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { listTeachersForSelect } from '@/lib/queries/users';
import { CourseFormClient } from '@/components/teacher/CourseFormClient';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Buat Course Baru - Admin',
};

export default async function NewAdminCoursePage() {
  const [, categories, teachers] = await Promise.all([
    requirePageUser({ callbackUrl: '/admin/courses/new', roles: ['admin'] }),
    listCategoriesWithCounts(),
    listTeachersForSelect(),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button href="/admin/courses" variant="ghost" size="sm" className="-ml-2 mb-3">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Course</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Buat Course Baru
        </h1>
        <p className="text-muted mt-1">
          Tambahkan course baru dan tetapkan pengajar serta rentang waktu kelasnya.
        </p>
      </div>

      {teachers.length === 0 ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Belum ada akun dengan peran Teacher. Tambahkan atau ubah peran pengguna menjadi
          Teacher terlebih dahulu sebelum membuat course baru.
        </div>
      ) : null}

      <CourseFormClient
        categories={categories}
        isAdmin
        teachers={teachers}
        cancelHref="/admin/courses"
      />
    </div>
  );
}
