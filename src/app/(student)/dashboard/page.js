import { redirect } from 'next/navigation';
import { requirePageUser } from '@/lib/pageAuth';
import { listStudentEnrollments } from '@/lib/queries/enrollments';
import { AppFrame } from '@/components/layout/AppFrame';
import { StudentDashboardClient } from '@/components/student/StudentDashboardClient';
import { Avatar } from '@/components/ui/Avatar';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';
import { StatStrip } from '@/components/ui/StatStrip';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Learning Dashboard',
};

export default async function StudentDashboardPage() {
  const user = await requirePageUser({ callbackUrl: '/dashboard' });
  if (user.role === 'teacher') redirect('/teacher');
  if (user.role === 'admin') redirect('/admin');

  const enrollments = await listStudentEnrollments(user.id);
  const activeCount = enrollments.filter((e) => e.enrollment_status === 'active').length;
  const completedCount = enrollments.filter((e) => e.enrollment_status === 'completed').length;
  const certificateCount = enrollments.filter((e) => Boolean(e.certificate_code)).length;

  return (
    <AppFrame user={user}>
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <section className="rounded-3xl bg-white border border-line p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1.5 min-w-0">
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink tracking-tight">
                Halo, {user.name}! 
              </h1>
              <p className="text-base sm:text-lg text-muted">
                Pantau seluruh course yang Anda ikuti dan lanjutkan materi dari titik terakhir Anda.
              </p>
            </div>
          </div>

          <StatStrip
            surface="page"
            items={[
              { value: `${activeCount}`, label: 'Course Aktif' },
              { value: `${completedCount}`, label: 'Course Selesai' },
              { value: `${certificateCount}`, label: 'Sertifikat Diraih' },
            ]}
          />
        </section>

        <StudentDashboardClient
          enrollments={enrollments}
          initialTeacherApplication={user.latest_teacher_application}
        />
      </main>
    </AppFrame>
  );
}
