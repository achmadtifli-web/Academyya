import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getCourseById } from '@/lib/queries/courses';
import { listMaterialsForCourse } from '@/lib/queries/materials';
import { MaterialManagerClient } from '@/components/teacher/MaterialManagerClient';
import { Button } from '@/components/ui/Button';
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
  if (user.role !== 'admin' && Number(course.teacher_id) !== Number(user.id)) {
    redirect('/403');
  }

  const materials = await listMaterialsForCourse(courseId);

  return (
    <div className="space-y-6">
      <div>
        <Button href="/teacher/courses" variant="outline" size="sm">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Course</span>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Kelola Materi Pembelajaran</h1>
        <p className="text-base text-muted">
          Tambahkan materi berurutan, ubah urutan tampil dengan tombol panah, lalu publikasikan course.
        </p>
      </div>

      <MaterialManagerClient initialCourse={course} initialMaterials={materials} />
    </div>
  );
}
