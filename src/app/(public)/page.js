import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  MessageSquare,
  PlayCircle,
  UserCheck,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { getPlatformStats, listPopularCourses } from '@/lib/queries/courses';
import { listStudentEnrollments } from '@/lib/queries/enrollments';
import { CourseCard } from '@/components/course/CourseCard';
import { HeroVisual } from '@/components/layout/HeroVisual';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';
import { StatStrip } from '@/components/ui/StatStrip';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Academyya: Learn Skills. Build Your Future.',
};

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Pilih & Ikuti Course',
    description:
      'Cari topik sesuai minat dan tingkat kemampuan, lalu daftar ke kelas hanya dalam satu klik.',
    Icon: BookOpen,
    badgeClass: 'bg-primary-light text-primary-dark',
  },
  {
    title: 'Belajar Materi Berurutan',
    description:
      'Pelajari materi langkah demi langkah dan tandai sesi selesai dengan tombol Mark as Done.',
    Icon: CheckCircle2,
    badgeClass: 'bg-coral-light text-coral-ink',
  },
  {
    title: 'Diskusi Bersama Pengajar',
    description:
      'Ajukan pertanyaan langsung di ruang diskusi tiap materi dan dapatkan jawaban dari pengajar.',
    Icon: MessageSquare,
    badgeClass: 'bg-accent-light text-ink',
  },
  {
    title: 'Raih Sertifikat Digital',
    description:
      'Selesaikan seluruh materi hingga 100% dan unduh sertifikat kelulusan dengan kode unik.',
    Icon: Award,
    badgeClass: 'bg-purple-light text-purple',
  },
];

export default async function HomePage() {
  const [user, stats, categories, popularCourses] = await Promise.all([
    getCurrentUser(),
    getPlatformStats(),
    listCategoriesWithCounts(),
    listPopularCourses(4),
  ]);

  let activeEnrollment = null;
  if (user && user.role === 'student') {
    const enrollments = await listStudentEnrollments(user.id);
    activeEnrollment =
      enrollments.find((e) => e.enrollment_status === 'active') || enrollments[0] || null;
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-page pt-10 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-ink leading-[1.15] tracking-tight">
              Belajar <HighlightUnderline>Skill Baru</HighlightUnderline> Kapan Saja, di Mana Saja.
            </h1>

            <p className="text-muted text-base sm:text-lg max-w-xl leading-relaxed">
              Akses kursus terstruktur dari pengajar terverifikasi. Pantau progres belajarmu langkah demi langkah dan raih sertifikat digital.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Button
                href={user?.role === 'student' ? '/dashboard' : '/courses'}
                variant="primary"
                size="lg"
              >
                <span>Mulai Belajar</span>
              </Button>
              <Button href="/#cara-kerja" variant="outline" size="lg">
                <span>Cara Kerja</span>
              </Button>
            </div>

            <StatStrip
              items={[
                { value: `${stats.total_courses}`, label: 'Course Pilihan' },
                { value: `${stats.total_students}`, label: 'Siswa Belajar' },
                { value: `${stats.total_teachers}`, label: 'Pengajar Terverifikasi' },
              ]}
            />
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Category Explorer */}
      {categories.length > 0 && (
        <section id="kategori" className="bg-white py-10 sm:py-14 border-y border-line scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4 text-center">
              <h2 className="font-heading text-xl font-semibold text-ink">
                Jelajahi Kategori Pembelajaran
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/courses?category=${cat.slug}`}
                    className="min-h-11 px-5 py-2.5 rounded-full border border-line bg-white hover:border-primary-hover hover:bg-primary-light/50 font-medium text-sm sm:text-base text-ink inline-flex items-center gap-2 transition"
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4 text-primary-hover" />
                    <span>{cat.name}</span>
                    <span className="text-xs font-semibold text-muted">
                      ({cat.published_courses_count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular Courses */}
      <section className="bg-page py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
                Course <HighlightUnderline>Populer</HighlightUnderline>
              </h2>
              <p className="text-base text-muted">
                Kelas pilihan dengan materi terstruktur yang siap dipelajari sekarang.
              </p>
            </div>
            <Button href="/courses" variant="outline" size="sm">
              <span>Lihat Semua</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {popularCourses.length === 0 ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-center text-muted">
              Belum ada course yang dipublikasikan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className="bg-white py-16 border-t border-line scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
              Cara Belajar di <HighlightUnderline>Academyya</HighlightUnderline>
            </h2>
            <p className="text-base text-muted">
              Empat langkah sederhana agar belajar tetap terarah dari awal hingga memperoleh sertifikat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, index) => {
              const Icon = step.Icon;
              return (
                <div
                  key={step.title}
                  className="rounded-3xl p-6 bg-page border border-line flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${step.badgeClass}`}
                    >
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <span className="font-heading text-sm font-bold text-muted">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="text-base text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contextual Recommendation / Teacher CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {activeEnrollment ? (
          <div className="rounded-3xl bg-primary-light/80 border border-primary/25 p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-sm font-semibold text-primary-dark">
                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                <span>Lanjutkan Belajarmu</span>
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
                {activeEnrollment.title}
              </h2>
              <div className="space-y-1.5 max-w-md">
                <div className="flex justify-between text-sm font-semibold text-ink">
                  <span>Progres saat ini</span>
                  <span>{activeEnrollment.progress_percent}% Selesai</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white overflow-hidden border border-primary/20">
                  <div
                    className="h-full rounded-full bg-primary-hover"
                    style={{ width: `${activeEnrollment.progress_percent}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                href={
                  activeEnrollment.next_material_id || activeEnrollment.first_material_id
                    ? `/learn/${activeEnrollment.slug}/${
                        activeEnrollment.next_material_id || activeEnrollment.first_material_id
                      }`
                    : `/learn/${activeEnrollment.slug}`
                }
                variant="primary"
                size="lg"
              >
                <span>Lanjutkan Belajar</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-primary-light/80 border border-primary/25 p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-coral/20"
            />
            <div
              aria-hidden="true"
              className="hidden sm:block absolute right-24 -top-10 w-24 h-24 rounded-full bg-accent/35"
            />
            <div className="space-y-3 max-w-2xl relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-sm font-semibold text-primary-dark">
                <UserCheck className="w-4 h-4" aria-hidden="true" />
                <span>Program Pengajar Academyya</span>
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
                Siap Berbagi Ilmu sebagai Pengajar?
              </h2>
              <p className="text-base text-ink/85 leading-relaxed">
                Daftarkan diri Anda menjadi Teacher terverifikasi, susun materi pembelajaran langkah demi langkah, dan bantu lebih banyak pelajar menguasai keahlian baru.
              </p>
            </div>
            <div className="shrink-0 relative z-10">
              <Button href="/register?type=teacher" variant="primary" size="lg">
                <span>Daftar Jadi Teacher</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
