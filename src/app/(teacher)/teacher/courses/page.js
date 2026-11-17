import { getCurrentUser } from '@/lib/auth';
import { listTeacherCourses } from '@/lib/queries/courses';
import { TeacherCoursesClient } from '@/components/teacher/TeacherCoursesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Course',
};

export default async function TeacherCoursesPage() {
  const user = await getCurrentUser();
  const courses = await listTeacherCourses(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Kelola Course Saya</h1>
        <p className="text-base text-muted">
          Buat course baru, perbarui informasi kelas, atur urutan materi, dan publikasikan ke katalog.
        </p>
      </div>

      <TeacherCoursesClient initialCourses={courses} />
    </div>
  );
}
