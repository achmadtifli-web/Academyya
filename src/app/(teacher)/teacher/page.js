import Link from 'next/link';
import { requirePageUser } from '@/lib/pageAuth';
import { getTeacherDashboardSummary, listTeacherCourses } from '@/lib/queries/courses';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Teacher Dashboard',
};

export default async function TeacherDashboardPage() {
  const user = await requirePageUser({ callbackUrl: '/teacher' });
  const [summary, courses] = await Promise.all([
    getTeacherDashboardSummary(user.id),
    listTeacherCourses(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">
          Halo, <HighlightUnderline>{user.name}</HighlightUnderline>
        </h1>
        <p className="text-base text-muted">
          Kelola course, susun materi pembelajaran, dan pantau perkembangan siswa Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Course"
          value={summary?.total_courses ?? 0}
          tone="blue"
        />
        <StatCard
          label="Sudah Published"
          value={summary?.published_courses ?? 0}
          tone="green"
        />
        <StatCard
          label="Siswa Terdaftar"
          value={summary?.total_enrollments ?? 0}
          tone="coral"
        />
        <StatCard
          label="Siswa Lulus 100%"
          value={summary?.completed_enrollments ?? 0}
          tone="purple"
        />
      </div>

      <section className="rounded-3xl bg-white border border-line p-6 space-y-4">
        
        <div>
          <h2 className="font-heading text-xl font-semibold text-ink">
            Course Terbaru Anda
          </h2>
        </div>
        {courses.length === 0 ? (
          <p className="text-base text-muted py-4">
            Anda belum memiliki course. Buka halaman{' '}
            <Link href="/teacher/courses" className="font-semibold text-primary-hover hover:underline">
              Kelola Course
            </Link>{' '}
            untuk membuat course pertama Anda.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {courses.slice(0, 5).map((course) => (
              <div
                key={course.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={course.status} />
                    <span className="text-sm text-muted">{course.category_name}</span>
                  </div>
                  <Link
                    href={`/teacher/courses/${course.id}/materials`}
                    className="min-h-11 inline-flex items-center font-heading font-semibold text-lg text-ink hover:text-primary-hover"
                  >
                    {course.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {course.total_materials} materi · {course.total_students} siswa
                  </p>
                </div>

                <Button
                  href={`/teacher/courses/${course.id}/materials`}
                  variant="outline"
                  size="sm"
                >
                  Kelola Materi
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/teacher/courses" variant="outline" size="sm">
            Lihat Semua Course
          </Button>
        </div>
      </section>
    </div>
  );
}
