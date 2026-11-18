'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Award, CheckCircle2, PlayCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';

export function EnrollButton({ course, currentUser, enrollment }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Guest state: route through /login with callbackUrl back to this course detail.
  if (!currentUser) {
    return (
      <div className="space-y-3">
        <Button
          href={`/login?callbackUrl=/courses/${course.slug}`}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <span>Masuk untuk Ikuti Course</span>
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Button>
        <p className="text-sm text-muted text-center">
          Belum punya akun?{' '}
          <a
            href={`/register?callbackUrl=/courses/${course.slug}`}
            className="min-h-11 inline-flex items-center font-semibold text-primary-dark underline"
          >
            Daftar gratis di sini
          </a>
        </p>
      </div>
    );
  }

  const isOwnerOrAdmin =
    currentUser.role === 'admin' ||
    (currentUser.role === 'teacher' && Number(course.teacher_id) === Number(currentUser.id));

  if (isOwnerOrAdmin) {
    const manageHref =
      currentUser.role === 'admin'
        ? `/admin/courses/${course.id}/materials`
        : `/teacher/courses/${course.id}/materials`;

    return (
      <div className="space-y-3">
        <Button
          href={manageHref}
          variant="outline"
          size="lg"
          className="w-full"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span>Kelola Materi Course</span>
        </Button>
        <Button href={`/learn/${course.slug}`} variant="ghost" size="sm" className="w-full">
          <PlayCircle className="w-4 h-4" aria-hidden="true" />
          <span>Pratinjau Ruang Belajar</span>
        </Button>
      </div>
    );
  }

  if (currentUser.role !== 'student') {
    return (
      <div className="rounded-2xl border border-line bg-page p-4 text-sm text-muted text-center">
        Akun Teacher hanya dapat mendaftar sebagai Student pada course milik sendiri atau mengelola kelasnya di Teacher Panel.
      </div>
    );
  }

  // Enrolled Student state
  if (enrollment) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-page border border-line p-4 space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Sudah Terdaftar</span>
            </span>
            <span className="text-ink">{enrollment.progress_percent}% Selesai</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${enrollment.progress_percent}%` }}
            />
          </div>
        </div>

        <Button href={`/learn/${course.slug}`} variant="success" size="lg" className="w-full">
          <PlayCircle className="w-5 h-5" aria-hidden="true" />
          <span>Lanjutkan Belajar</span>
        </Button>

        {enrollment.certificate_code && (
          <Button
            href={`/certificates/${enrollment.certificate_code}`}
            variant="outline"
            size="md"
            className="w-full"
          >
            <Award className="w-5 h-5" aria-hidden="true" />
            <span>Lihat Sertifikat</span>
          </Button>
        )}
      </div>
    );
  }

  const handleEnroll = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id }),
      });
      const json = await res.json();

      if (res.status === 409) {
        // Handle duplicate enrollment gracefully per TC-05.
        showToast({ type: 'info', message: 'Anda sudah terdaftar. Mengarahkan ke ruang belajar...' });
        router.push(`/learn/${course.slug}`);
        router.refresh();
        return;
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mendaftar ke course.');
      }

      showToast({ type: 'success', message: 'Berhasil mendaftar! Selamat belajar.' });
      router.push(`/learn/${course.slug}`);
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal mendaftar ke course.' });
      setSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleEnroll}
      loading={submitting}
      variant="primary"
      size="lg"
      className="w-full"
    >
      <span>{submitting ? 'Mendaftarkan...' : 'Ikuti Course Sekarang'}</span>
      <ArrowRight className="w-5 h-5" aria-hidden="true" />
    </Button>
  );
}
