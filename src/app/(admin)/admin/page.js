import {
  BookOpen,
  Clock,
  FolderTree,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { getAdminStats } from '@/lib/queries/users';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/Button';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">
          Ringkasan <HighlightUnderline>Platform</HighlightUnderline>
        </h1>
        <p className="text-base text-muted">
          Pantau statistik pengguna, publikasi course, dan antrean verifikasi pengajar Academyya.
        </p>
      </div>

      {stats.pending_teacher_requests > 0 && (
        <div className="rounded-3xl border border-accent-dark/30 bg-accent-light p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Clock className="w-6 h-6 text-accent-dark shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">
                {stats.pending_teacher_requests} Pengajuan Teacher Menunggu Tinjauan
              </h2>
              <p className="text-base text-ink/90 mt-0.5">
                Periksa profil, keahlian, dan portofolio pelamar sebelum memberikan akses pengajar.
              </p>
            </div>
          </div>
          <Button href="/admin/teacher-requests" variant="primary">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Tinjau Pengajuan</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Pengguna"
          value={stats.total_users}
          helper={`${stats.total_students} Student · ${stats.total_teachers} Teacher`}
          tone="blue"
        />
        <StatCard
          label="Pengajuan Pending"
          value={stats.pending_teacher_requests}
          helper="Menunggu verifikasi"
          tone="amber"
        />
        <StatCard
          label="Course Published"
          value={stats.published_courses}
          helper={`${stats.draft_courses} draft · ${stats.total_categories} kategori`}
          tone="green"
        />
        <StatCard
          label="Total Pendaftaran"
          value={stats.total_enrollments}
          helper={`${stats.completed_enrollments} selesai 100%`}
          tone="coral"
        />
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white border border-line p-5 space-y-3">
          <ShieldCheck className="w-6 h-6 text-coral-text" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold text-ink">Verifikasi Teacher</h2>
          <p className="text-sm text-muted">
            Setujui atau tolak calon pengajar dengan catatan verifikasi.
          </p>
          <Button href="/admin/teacher-requests" variant="outline" size="sm" className="w-full">
            Buka Antrean
          </Button>
        </div>

        <div className="rounded-3xl bg-white border border-line p-5 space-y-3">
          <FolderTree className="w-6 h-6 text-primary-hover" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold text-ink">Kelola Kategori</h2>
          <p className="text-sm text-muted">
            Tambah, ubah, dan jaga integritas kategori pembelajaran.
          </p>
          <Button href="/admin/categories" variant="outline" size="sm" className="w-full">
            Atur Kategori
          </Button>
        </div>

        <div className="rounded-3xl bg-white border border-line p-5 space-y-3">
          <BookOpen className="w-6 h-6 text-success" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold text-ink">Moderasi Course</h2>
          <p className="text-sm text-muted">
            Tinjau course aktif atau turunkan course yang belum sesuai standar.
          </p>
          <Button href="/admin/courses" variant="outline" size="sm" className="w-full">
            Kelola Course
          </Button>
        </div>

        <div className="rounded-3xl bg-white border border-line p-5 space-y-3">
          <Users className="w-6 h-6 text-purple" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold text-ink">Kelola Pengguna</h2>
          <p className="text-sm text-muted">
            Lihat daftar akun terdaftar, filter berdasarkan peran, atau hapus akun pengguna.
          </p>
          <Button href="/admin/users" variant="outline" size="sm" className="w-full">
            Lihat Pengguna
          </Button>
        </div>
      </section>
    </div>
  );
}
