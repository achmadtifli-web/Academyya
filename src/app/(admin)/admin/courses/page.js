import { listCoursesForAdmin } from '@/lib/queries/courses';
import { AdminCoursesClient } from '@/components/admin/AdminCoursesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Moderasi Course',
};

export default async function AdminCoursesPage() {
  const courses = await listCoursesForAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Moderasi Course</h1>
        <p className="text-base text-muted">
          Pantau seluruh course dari semua pengajar, ubah status publikasi, atau hapus course yang melanggar ketentuan.
        </p>
      </div>

      <AdminCoursesClient initialCourses={courses} />
    </div>
  );
}
