import { ChevronLeft } from 'lucide-react';
import { MaterialManagerClient } from '@/components/teacher/MaterialManagerClient';
import { Button } from '@/components/ui/Button';

export function CourseMaterialsView({
  course,
  materials,
  backHref,
  backLabel,
  showTeacher = false,
}) {
  return (
    <div className="space-y-6">
      <div>
        <Button href={backHref} variant="outline" size="sm">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Kelola Materi Pembelajaran</h1>
        <p className="text-base text-muted">
          Tambahkan materi berurutan, ubah urutan tampil dengan tombol panah, lalu publikasikan course.
        </p>
        {showTeacher && course.teacher_name && (
          <p className="text-sm font-medium text-muted pt-1">
            Pengajar: <span className="text-ink font-semibold">{course.teacher_name}</span> · Kategori:{' '}
            <span className="text-ink font-semibold">{course.category_name}</span>
          </p>
        )}
      </div>

      <MaterialManagerClient initialCourse={course} initialMaterials={materials} />
    </div>
  );
}
