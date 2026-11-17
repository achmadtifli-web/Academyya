import { getCurrentUser } from '@/lib/auth';
import { listTeacherCourses } from '@/lib/queries/courses';
import { listTeacherStudents } from '@/lib/queries/enrollments';
import { TeacherStudentsClient } from '@/components/teacher/TeacherStudentsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Progres Siswa',
};

export default async function TeacherStudentsPage() {
  const user = await getCurrentUser();
  const [students, courses] = await Promise.all([
    listTeacherStudents(user.id),
    listTeacherCourses(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Monitor Progres Siswa</h1>
        <p className="text-base text-muted">
          Pantau seluruh siswa yang terdaftar di course Anda beserta persentase penyelesaian materinya.
        </p>
      </div>

      <TeacherStudentsClient initialStudents={students} courses={courses} />
    </div>
  );
}
