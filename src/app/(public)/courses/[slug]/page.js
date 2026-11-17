import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, BookOpen, Clock, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getCourseDetailBySlug } from '@/lib/queries/courses';
import { EnrollButton } from '@/components/course/EnrollButton';
import { SyllabusList } from '@/components/course/SyllabusList';
import { StatusBadge } from '@/components/ui/Badge';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const detail = await getCourseDetailBySlug(slug, user);
  return {
    title: detail ? detail.course.title : 'Detail Course',
  };
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();
  const detail = await getCourseDetailBySlug(slug, currentUser);

  if (!detail) {
    notFound();
  }

  const { course, materials, enrollment } = detail;
  const isOwnerOrAdmin =
    currentUser &&
    (currentUser.role === 'admin' ||
      (currentUser.role === 'teacher' &&
        Number(course.teacher_id) === Number(currentUser.id)));
  const canAccessLessons = Boolean(enrollment) || Boolean(isOwnerOrAdmin);

  return (
    <main className="flex-1">
      {/* Split Hero Header */}
      <section className="bg-white border-b border-line py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            <nav aria-label="Breadcrumb" className="text-sm font-medium text-muted flex flex-wrap items-center gap-2">
              <Link href="/courses" className="min-h-11 inline-flex items-center hover:text-primary-hover">
                Katalog
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href={`/courses?category=${course.category_slug}`}
                className="min-h-11 inline-flex items-center hover:text-primary-hover"
              >
                {course.category_name}
              </Link>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full bg-primary-light text-primary-dark px-3.5 py-1 text-sm font-semibold">
                {course.category_name}
              </span>
              <StatusBadge status={course.level} />
              {course.status === 'draft' && <StatusBadge status="draft" />}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink leading-tight tracking-tight">
              {course.title}
            </h1>

            <p className="text-muted text-base sm:text-lg leading-relaxed">
              {course.description}
            </p>

            {/* Instructor Card Pill */}
            <div className="rounded-2xl border border-line bg-page p-4 sm:p-5 flex items-start gap-4">
              <span className="w-12 h-12 rounded-full bg-primary-light text-primary-dark font-heading font-bold text-lg flex items-center justify-center shrink-0">
                {course.teacher_name?.charAt(0)?.toUpperCase() || 'T'}
              </span>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading font-semibold text-base text-ink">
                    {course.teacher_name}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-light text-primary-dark px-2.5 py-0.5 text-xs font-semibold">
                    <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Teacher Terverifikasi</span>
                  </span>
                </div>
                {course.teacher_bio && (
                  <p className="text-sm text-muted leading-relaxed">{course.teacher_bio}</p>
                )}
              </div>
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-6 pt-1 text-sm sm:text-base font-medium text-ink">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-hover" aria-hidden="true" />
                <span>{course.total_materials} Materi</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="w-5 h-5 text-coral-text" aria-hidden="true" />
                <span>Total {course.total_duration} menit</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-dark" aria-hidden="true" />
                <span>{course.total_students} Siswa Terdaftar</span>
              </span>
            </div>
          </div>

          {/* Right Elevated Enrollment Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white border-2 border-line p-6 shadow-md space-y-5 relative overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-coral/15"
              />
              <div className="aspect-video rounded-2xl overflow-hidden bg-primary-light relative flex items-center justify-center">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={`Sampul ${course.title}`}
                    width={640}
                    height={360}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <BookOpen className="w-12 h-12 text-primary-dark mx-auto" aria-hidden="true" />
                    <p className="font-heading font-semibold text-primary-dark text-base">
                      {course.category_name}
                    </p>
                  </div>
                )}
              </div>

              <EnrollButton
                course={course}
                currentUser={currentUser}
                enrollment={enrollment}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum / Syllabus Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
            Daftar <HighlightUnderline>Materi</HighlightUnderline> Pembelajaran
          </h2>
          <p className="text-base text-muted">
            {canAccessLessons
              ? 'Klik materi di bawah ini untuk langsung membuka sesi belajar.'
              : 'Daftar sesi pembelajaran yang akan Anda pelajari setelah mengikuti course.'}
          </p>
        </div>

        <SyllabusList
          materials={materials}
          courseSlug={course.slug}
          canAccessLessons={canAccessLessons}
        />
      </section>
    </main>
  );
}
