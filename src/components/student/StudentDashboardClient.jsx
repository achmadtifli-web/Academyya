'use client';

import { useState } from 'react';
import { Award, BookOpen, Clock, PlayCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, TextareaField } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Sedang Dipelajari' },
  { key: 'completed', label: 'Selesai' },
];

export function StudentDashboardClient({
  enrollments = [],
  initialTeacherApplication = null,
}) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [teacherApp, setTeacherApp] = useState(initialTeacherApplication);

  const [reapplyOpen, setReapplyOpen] = useState(false);
  const [expertise, setExpertise] = useState(initialTeacherApplication?.expertise || '');
  const [motivation, setMotivation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const visibleEnrollments = enrollments.filter((item) =>
    filter === 'all' ? true : item.enrollment_status === filter
  );

  const handleReapply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    try {
      const res = await fetch('/api/teacher-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertise,
          motivation,
          portfolio_url: portfolioUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal mengirim pengajuan ulang.');
      }
      setTeacherApp(json.data.application);
      setReapplyOpen(false);
      showToast({ type: 'success', message: json.message });
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal mengirim pengajuan ulang.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending or Rejected Teacher Application Status Banner */}
      {teacherApp && teacherApp.status === 'pending' && (
        <div className="rounded-3xl border border-accent-dark/30 bg-accent-light p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Clock className="w-6 h-6 text-accent-dark shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">
                Pengajuan Teacher: Menunggu Verifikasi Admin
              </h2>
              <p className="mt-1 text-base text-ink/90">
                Pengajuan keahlian <strong>{teacherApp.expertise}</strong> sedang ditinjau. Anda tetap dapat mengikuti course sebagai Student sambil menunggu persetujuan.
              </p>
            </div>
          </div>
          <StatusBadge status="pending" />
        </div>
      )}

      {teacherApp && teacherApp.status === 'rejected' && (
        <div className="rounded-3xl border border-danger/30 bg-danger-light p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <XCircle className="w-6 h-6 text-danger-ink shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-danger-ink">
                Pengajuan Teacher Ditolak
              </h2>
              <p className="mt-1 text-base text-ink">
                Catatan Admin: {teacherApp.review_note || 'Lengkapi data dan ajukan ulang.'}
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setReapplyOpen(true)}>
            Ajukan Ulang
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter daftar belajar">
          {TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? enrollments.length
                : enrollments.filter((e) => e.enrollment_status === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.key)}
                className={`min-h-11 px-5 rounded-full text-sm font-semibold border transition ${
                  active
                    ? 'bg-primary-hover text-white border-primary-hover'
                    : 'bg-white text-ink border-line hover:border-primary'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <Button href="/courses" variant="outline" size="sm">
          Jelajahi Katalog
        </Button>
      </div>

      {/* Enrolled Courses Grid */}
      {visibleEnrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            enrollments.length === 0
              ? 'Belum ada course yang diikuti'
              : 'Belum ada course pada status ini'
          }
          description={
            enrollments.length === 0
              ? 'Mulai pilih course di katalog Academyya untuk mencatat progres belajar dan memperoleh sertifikat digital.'
              : 'Pilih tab lain atau jelajahi katalog course baru.'
          }
          actionLabel="Jelajahi Course"
          actionHref="/courses"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEnrollments.map((item) => {
            const targetMaterialId = item.next_material_id || item.first_material_id;
            const learnHref = targetMaterialId
              ? `/learn/${item.slug}/${targetMaterialId}`
              : `/learn/${item.slug}`;

            return (
              <article
                key={item.enrollment_id}
                className="rounded-3xl border border-line bg-white p-5 sm:p-6 flex flex-col gap-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-block rounded-full bg-page border border-line px-3 py-1 text-xs font-semibold text-muted">
                    {item.category_name}
                  </span>
                  <StatusBadge status={item.enrollment_status} />
                </div>

                <div>
                  <h3 className="font-heading text-lg font-semibold text-ink line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">Pengajar: {item.teacher_name}</p>
                </div>

                <div className="mt-auto space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-muted">
                      {item.completed_materials} dari {item.total_materials} materi
                    </span>
                    <span className="text-ink">{item.progress_percent}% Selesai</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-page border border-line overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.progress_percent === 100 ? 'bg-success' : 'bg-primary-hover'
                      }`}
                      style={{ width: `${item.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    href={learnHref}
                    variant={item.progress_percent === 100 ? 'outline' : 'primary'}
                    className="w-full"
                  >
                    <PlayCircle className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {item.progress_percent === 100 ? 'Ulas Kembali Materi' : 'Lanjutkan Belajar'}
                    </span>
                  </Button>

                  {item.certificate_code && (
                    <Button
                      href={`/certificates/${item.certificate_code}`}
                      variant="success"
                      className="w-full"
                    >
                      <Award className="w-4 h-4" aria-hidden="true" />
                      <span>Lihat Sertifikat</span>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Re-apply Teacher Modal */}
      <Modal
        open={reapplyOpen}
        onClose={() => setReapplyOpen(false)}
        title="Ajukan Ulang Menjadi Teacher"
      >
        <form onSubmit={handleReapply} className="space-y-4">
          <InputField
            id="reapply-expertise"
            label="Bidang Keahlian"
            required
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            error={fieldErrors.expertise}
            placeholder="Contoh: Analisis Data & Spreadsheet"
          />
          <TextareaField
            id="reapply-motivation"
            label="Motivasi & Rencana Pengajaran"
            required
            rows={4}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            error={fieldErrors.motivation}
            placeholder="Jelaskan pengalaman mengajar dan rencana materi yang ingin Anda buat..."
          />
          <InputField
            id="reapply-portfolio"
            label="Tautan Portofolio (Opsional)"
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            error={fieldErrors.portfolio_url}
            placeholder="https://linkedin.com/in/..."
          />
          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReapplyOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
