import { notFound } from 'next/navigation';
import { Award, CheckCircle2, ChevronLeft } from 'lucide-react';
import { getCertificateByCode } from '@/lib/queries/certificates';
import { PrintCertificateButton } from '@/components/student/PrintCertificateButton';
import { Button } from '@/components/ui/Button';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { code } = await params;
  return {
    title: `Sertifikat ${code}`,
  };
}

export default async function CertificateDetailPage({ params }) {
  const { code } = await params;
  const cert = await getCertificateByCode(code);

  if (!cert) {
    notFound();
  }

  const formattedDate = new Date(cert.issued_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Button href="/certificates" variant="outline" size="sm">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Daftar Sertifikat</span>
        </Button>

        <PrintCertificateButton />
      </div>

      {/* Printable Certificate Sheet */}
      <section
        aria-label="Sertifikat Kelulusan Digital"
        className="print-sheet bg-white rounded-3xl border-4 border-primary/20 p-8 sm:p-14 relative overflow-hidden shadow-lg"
      >
        {/* Signature Decorative Geometric Motifs */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-coral/20"
        />
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-10 w-36 h-36 rounded-full border-2 border-ink/40"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-accent/35"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-8 right-10 w-14 h-14 rounded-full bg-purple/20"
        />

        <div className="relative z-10 text-center space-y-6 py-4">
          <div className="inline-flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full bg-primary-hover text-white font-heading font-bold text-base flex items-center justify-center">
              Ac
            </span>
            <span className="font-heading font-bold text-xl text-primary-dark">
              Academyya
            </span>
          </div>

          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-success-light text-success px-4 py-1 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Terverifikasi Resmi</span>
            </p>
            <h1 className="font-heading text-2xl sm:text-4xl font-bold text-ink tracking-tight pt-2">
              <HighlightUnderline>SERTIFIKAT KELULUSAN</HighlightUnderline>
            </h1>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-base text-muted">Diberikan dengan bangga kepada:</p>
            <p className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark">
              {cert.student_name}
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            <p className="text-base text-muted">
              Telah menyelesaikan seluruh {cert.total_materials} materi pembelajaran ({cert.total_duration} menit) pada kelas:
            </p>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink">
              {cert.course_title}
            </h2>
            <p className="text-sm font-medium text-muted">
              Kategori: {cert.category_name} · Level: {cert.level}
            </p>
          </div>

          <div className="pt-8 mt-6 border-t border-line grid sm:grid-cols-3 gap-6 items-end text-left sm:text-center">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted uppercase">Tanggal Terbit</p>
              <p className="text-base font-semibold text-ink">{formattedDate}</p>
            </div>

            <div className="flex flex-col items-start sm:items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-accent-light border border-accent-dark/30 text-accent-dark flex items-center justify-center mb-1">
                <Award className="w-7 h-7" aria-hidden="true" />
              </div>
              <p className="text-xs font-semibold text-muted">Kode Verifikasi</p>
              <p className="text-sm font-bold text-ink tracking-wide">
                {cert.certificate_code}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted uppercase">Pengajar Course</p>
              <p className="text-base font-semibold text-ink">{cert.teacher_name}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
