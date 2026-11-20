'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Award, ChevronDown, ChevronLeft, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DiscussionThread } from '@/components/learning/DiscussionThread';
import { MarkAsDoneButton } from '@/components/learning/MarkAsDoneButton';
import { MaterialSidebar } from '@/components/learning/MaterialSidebar';
import { MaterialViewer } from '@/components/learning/MaterialViewer';

export function LearningWorkspaceClient({
  course,
  initialMaterials,
  activeMaterial,
  initialProgress,
  initialCertificateCode,
  isPreviewMode,
  manageBackHref,
}) {
  const router = useRouter();
  const previewReturnHref = manageBackHref || `/teacher/courses/${course.id}/materials`;
  const [materials, setMaterials] = useState(initialMaterials);
  const [progressPercent, setProgressPercent] = useState(initialProgress.progress_percent);
  const [certificateCode, setCertificateCode] = useState(initialCertificateCode);
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  const currentIndex = materials.findIndex(
    (item) => Number(item.id) === Number(activeMaterial.id)
  );
  const prevMaterial = currentIndex > 0 ? materials[currentIndex - 1] : null;
  const nextMaterial =
    currentIndex >= 0 && currentIndex < materials.length - 1
      ? materials[currentIndex + 1]
      : null;

  const handleProgressChange = (result) => {
    setProgressPercent(result.progress_percent);
    setMaterials((prev) =>
      prev.map((m) =>
        Number(m.id) === Number(activeMaterial.id)
          ? { ...m, is_completed: result.is_completed }
          : m
      )
    );

    if (result.course_completed && result.certificate_code) {
      setCertificateCode(result.certificate_code);
      setCompletionModalOpen(true);
    } else if (!result.course_completed) {
      setCertificateCode(null);
    }

    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-page">
      {/* Top Focus Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              href={isPreviewMode ? previewReturnHref : '/dashboard'}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Kembali</span>
            </Button>
            <div className="min-w-0">
              <p className="font-heading font-semibold text-base sm:text-lg text-ink truncate">
                {course.title}
              </p>
              <p className="text-sm text-muted truncate">Oleh {course.teacher_name}</p>
            </div>
          </div>

          {!isPreviewMode && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2.5 bg-page border border-line rounded-full px-3.5 py-2">
                <div className="w-20 sm:w-32 h-2.5 rounded-full bg-line overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progressPercent === 100 ? 'bg-success' : 'bg-primary-hover'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-ink whitespace-nowrap">
                  {progressPercent}% Selesai
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {isPreviewMode && (
        <div className="bg-accent-light border-b border-accent-dark/20 px-4 py-2.5 text-center text-sm font-semibold text-ink">
          Mode Pratinjau Pengajar / Moderasi Admin: progres tidak dicatat pada mode ini.
        </div>
      )}

      {/* Mobile Collapsible Syllabus Drawer */}
      <div className="lg:hidden max-w-7xl w-full mx-auto px-4 pt-4">
        <button
          type="button"
          onClick={() => setMobileSyllabusOpen((prev) => !prev)}
          aria-expanded={mobileSyllabusOpen}
          className="w-full min-h-12 px-4 rounded-2xl border border-line bg-white flex items-center justify-between text-base font-semibold text-ink"
        >
          <span className="inline-flex items-center gap-2">
            <List className="w-5 h-5 text-primary-hover" aria-hidden="true" />
            <span>
              Daftar Materi ({activeMaterial.position}/{materials.length})
            </span>
          </span>
          <ChevronDown
            className={`w-5 h-5 text-muted transition ${mobileSyllabusOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {mobileSyllabusOpen && (
          <div className="mt-3">
            <MaterialSidebar
              courseSlug={course.slug}
              materials={materials}
              activeMaterialId={activeMaterial.id}
              onSelect={() => setMobileSyllabusOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Main 12-Column Learning Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <MaterialViewer material={activeMaterial} totalMaterials={materials.length} />

          {/* Sequential Navigation & Mark as Done Bar */}
          <div className="bg-white rounded-3xl border border-line p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              {prevMaterial ? (
                <Button href={`/learn/${course.slug}/${prevMaterial.id}`} variant="outline">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Sebelumnya</span>
                </Button>
              ) : (
                <Button href={`/courses/${course.slug}`} variant="ghost">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Detail Course</span>
                </Button>
              )}
            </div>

            {!isPreviewMode && (
              <MarkAsDoneButton
                key={activeMaterial.id}
                courseId={course.id}
                materialId={activeMaterial.id}
                initialCompleted={activeMaterial.is_completed}
                onProgressChange={handleProgressChange}
              />
            )}

            <div>
              {nextMaterial ? (
                <Button href={`/learn/${course.slug}/${nextMaterial.id}`} variant="primary">
                  <span>Berikutnya</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              ) : certificateCode ? (
                <Button href={`/certificates/${certificateCode}`} variant="accent">
                  <Award className="w-4 h-4" aria-hidden="true" />
                  <span>Lihat Sertifikat</span>
                </Button>
              ) : (
                <Button href={isPreviewMode ? previewReturnHref : '/dashboard'} variant="outline">
                  <span>{isPreviewMode ? 'Selesai Pratinjau' : 'Selesai Belajar'}</span>
                </Button>
              )}
            </div>
          </div>

          <DiscussionThread key={`disc-${activeMaterial.id}`} materialId={activeMaterial.id} />
        </div>

        {/* Sticky Desktop Syllabus Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-24">
          <MaterialSidebar
            courseSlug={course.slug}
            materials={materials}
            activeMaterialId={activeMaterial.id}
          />
          {certificateCode && (
            <div className="mt-4 rounded-3xl border border-success/30 bg-success-light p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-success font-heading font-semibold text-base">
                <Award className="w-5 h-5" aria-hidden="true" />
                <span>Sertifikat Telah Terbit</span>
              </div>
              <p className="text-sm text-ink">
                Kode verifikasi: <strong>{certificateCode}</strong>
              </p>
              <Link
                href={`/certificates/${certificateCode}`}
                className="inline-flex items-center justify-center min-h-11 w-full rounded-full bg-success text-white font-semibold text-sm hover:bg-green-800 transition"
              >
                Buka & Cetak Sertifikat
              </Link>
            </div>
          )}
        </aside>
      </main>

      {/* Course Completion & Certificate Modal */}
      <Modal
        open={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        title="Selamat! Course Telah Selesai 100%"
      >
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-full bg-success-light text-success flex items-center justify-center">
            <Award className="w-8 h-8" aria-hidden="true" />
          </div>
          <p className="text-base text-ink leading-relaxed">
            Anda telah menuntaskan seluruh materi pada <strong>{course.title}</strong>. Sertifikat digital Anda siap diunduh dan dicetak.
          </p>
          {certificateCode && (
            <p className="text-sm font-semibold text-primary-dark bg-primary-light rounded-2xl px-4 py-3">
              Kode Sertifikat: {certificateCode}
            </p>
          )}
          <div className="pt-2 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setCompletionModalOpen(false)}>
              Tetap di Materi
            </Button>
            {certificateCode && (
              <Button href={`/certificates/${certificateCode}`} variant="success">
                <Award className="w-4 h-4" aria-hidden="true" />
                <span>Lihat Sertifikat</span>
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
