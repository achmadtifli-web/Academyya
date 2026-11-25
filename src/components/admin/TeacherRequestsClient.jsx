'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, ExternalLink, FileText, UserCheck, XCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TextareaField } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

const FILTER_TABS = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'all', label: 'Semua' },
];

export function TeacherRequestsClient({ initialRequests = [] }) {
  const { showToast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [approveTarget, setApproveTarget] = useState(null);

  const filteredRequests = requests.filter((req) =>
    filter === 'all' ? true : req.status === filter
  );

  const handleDecision = async ({ id, action, review_note }) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/teacher-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, review_note }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors?.review_note) {
          setRejectError(json.fieldErrors.review_note);
          setProcessingId(null);
          return;
        }
        throw new Error(json.error || 'Gagal memproses pengajuan.');
      }

      setRequests((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: json.data.application.status,
                review_note: json.data.application.review_note,
                reviewed_at: json.data.application.reviewed_at,
                current_user_role: action === 'approve' ? 'teacher' : item.current_user_role,
              }
            : item
        )
      );

      showToast({ type: 'success', message: json.message });
      setApproveTarget(null);
      setRejectTarget(null);
      setRejectNote('');
      setRejectError('');
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal memproses pengajuan.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status pengajuan">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? requests.length
              : requests.filter((r) => r.status === tab.key).length;
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

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Tidak ada pengajuan pada filter ini"
          description="Belum ada permohonan pengajar dengan status yang dipilih saat ini."
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <article
              key={req.id}
              className="rounded-3xl border border-line bg-white p-6 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <Avatar src={req.applicant_avatar} name={req.applicant_name} size="lg" />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-heading text-xl font-semibold text-ink">
                        {req.applicant_name}
                      </h2>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-base text-muted">{req.applicant_email}</p>
                    <p className="text-sm text-muted inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>
                        Diajukan {new Date(req.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full bg-primary-light text-primary-dark px-4 py-1.5 text-sm font-semibold">
                  Keahlian: {req.expertise}
                </span>
              </div>

              {req.motivation && (
                <blockquote className="rounded-2xl bg-page border border-line p-4 text-base text-ink leading-relaxed">
                  {req.motivation}
                </blockquote>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-4">
                  {req.cv_url ? (
                    <a
                      href={req.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-11 px-4 rounded-full bg-primary-light/70 border border-primary/25 inline-flex items-center gap-2 text-sm font-semibold text-primary-dark hover:bg-primary-light transition"
                    >
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      <span>Lihat CV Pelamar (PDF)</span>
                    </a>
                  ) : (
                    <span className="text-sm text-muted">Tidak menyertakan file CV.</span>
                  )}

                  {req.portfolio_url ? (
                    <a
                      href={req.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-11 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      <span>Lihat Portofolio Pelamar</span>
                    </a>
                  ) : (
                    <span className="text-sm text-muted">Tidak menyertakan tautan portofolio.</span>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="dangerOutline"
                      onClick={() => {
                        setRejectTarget(req);
                        setRejectNote('');
                        setRejectError('');
                      }}
                      disabled={processingId === req.id}
                    >
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Tolak</span>
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => setApproveTarget(req)}
                      disabled={processingId === req.id}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Setujui</span>
                    </Button>
                  </div>
                )}
              </div>

              {req.status !== 'pending' && req.review_note && (
                <div className="rounded-2xl border border-line bg-page px-4 py-3 text-sm text-ink">
                  <strong>Catatan Admin:</strong> {req.review_note}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        onConfirm={() =>
          handleDecision({
            id: approveTarget.id,
            action: 'approve',
            review_note: 'Selamat! Pengajuan pengajar Anda telah diverifikasi dan disetujui.',
          })
        }
        title="Setujui Pengajuan Teacher?"
        message={
          approveTarget
            ? `Akun ${approveTarget.applicant_name} akan dipromosikan menjadi Teacher dan langsung dapat membuat course.`
            : ''
        }
        confirmLabel="Ya, Setujui Teacher"
        confirmVariant="success"
        loading={processingId === approveTarget?.id}
      />

      {/* Reject Confirmation + Reason Modal */}
      <ConfirmModal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => {
          if (rejectNote.trim().length < 5) {
            setRejectError('Masukkan alasan penolakan minimal 5 karakter.');
            return;
          }
          handleDecision({
            id: rejectTarget.id,
            action: 'reject',
            review_note: rejectNote.trim(),
          });
        }}
        title="Tolak Pengajuan Teacher"
        message={
          rejectTarget
            ? `Tuliskan alasan penolakan untuk ${rejectTarget.applicant_name} agar mereka dapat melengkapi data dan mengajukan ulang.`
            : ''
        }
        confirmLabel="Tolak Pengajuan"
        confirmVariant="danger"
        loading={processingId === rejectTarget?.id}
      >
        <TextareaField
          id="reject-review-note"
          label="Alasan Penolakan"
          required
          rows={3}
          value={rejectNote}
          onChange={(e) => {
            setRejectNote(e.target.value);
            if (rejectError) setRejectError('');
          }}
          error={rejectError}
          placeholder="Contoh: Mohon lampirkan tautan portofolio atau rencana silabus pembelajaran Anda."
        />
      </ConfirmModal>
    </div>
  );
}
