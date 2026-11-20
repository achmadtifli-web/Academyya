import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Award, CheckCircle2, ChevronLeft } from 'lucide-react';
import { getCertificateByCode } from '@/lib/queries/certificates';
import { PrintCertificateButton } from '@/components/student/PrintCertificateButton';
import { Button } from '@/components/ui/Button';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

const LEVEL_LABELS = {
  pemula: 'Pemula',
  menengah: 'Menengah',
  lanjut: 'Lanjut',
};

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
  const levelLabel = LEVEL_LABELS[cert.level] || cert.level;

  return (
    <main className="print-page-shell flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
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
        className="print-sheet bg-white rounded-3xl border border-line-strong p-3 sm:p-5 md:aspect-[297/210] flex flex-col shadow-lg overflow-hidden"
      >
        {/* Outer & Inner Double Certificate Frame */}
        <div className="flex-1 rounded-2xl print:rounded-lg border-2 border-primary-dark/25 p-1.5 flex flex-col">
          <div className="flex-1 rounded-xl print:rounded-md border border-primary/25 px-5 py-6 sm:px-10 sm:py-8 md:px-14 md:py-9 print:px-14 print:py-10 flex flex-col justify-between gap-6">
            {/* Top Brand & Verification Header */}
            <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
              <div className="inline-flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt=""
                  width={36}
                  height={36}
                  priority
                  className="w-9 h-9 object-contain shrink-0"
                />
                <span className="font-heading font-bold text-xl text-primary-dark tracking-tight">
                  Academyya
                </span>
              </div>

              <p className="inline-flex items-center gap-1.5 rounded-full bg-success-light border border-success/20 text-success px-3.5 py-1 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Terverifikasi Resmi</span>
              </p>
            </header>

            {/* Center Achievement Block */}
            <div className="my-auto text-center space-y-5 print:space-y-4">
              <div className="space-y-1.5">
                <h1 className="font-heading text-2xl sm:text-4xl lg:text-[2.5rem] font-bold text-ink tracking-tight text-balance leading-tight">
                  Sertifikat <HighlightUnderline>Kelulusan</HighlightUnderline>
                </h1>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-sm sm:text-base text-muted">
                  Diberikan dengan bangga kepada
                </p>
                <p className="font-heading text-2xl sm:text-4xl font-bold text-primary-dark tracking-tight text-balance">
                  {cert.student_name}
                </p>
                <div
                  aria-hidden="true"
                  className="w-16 h-0.5 bg-primary/30 mx-auto rounded-full mt-3"
                />
              </div>

              <div className="max-w-2xl mx-auto space-y-1.5">
                <p className="text-sm sm:text-base text-muted leading-relaxed text-pretty">
                  Telah menyelesaikan seluruh {cert.total_materials} materi pembelajaran (
                  {cert.total_duration} menit) pada kelas:
                </p>
                <h2 className="font-heading text-lg sm:text-2xl font-bold text-ink leading-snug text-balance">
                  {cert.course_title}
                </h2>
                <p className="text-sm font-medium text-muted pt-0.5">
                  Kategori: {cert.category_name} · Level: {levelLabel}
                </p>
              </div>
            </div>

            {/* Bottom Signature & Verification Row */}
            <div className="pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-5 sm:gap-6 items-center text-center">
              <div className="space-y-0.5 sm:text-left print:text-left">
                <p className="text-xs font-semibold text-muted">Tanggal Terbit</p>
                <p className="text-base font-semibold text-ink">{formattedDate}</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-1">
                <div className="w-11 h-11 rounded-full bg-accent-light border border-accent-dark/30 text-accent-dark flex items-center justify-center">
                  <Award className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium text-muted">Kode Verifikasi</p>
                <p className="text-sm font-bold text-ink tracking-wide">
                  {cert.certificate_code}
                </p>
              </div>

              <div className="space-y-0.5 sm:text-right print:text-right">
                <p className="text-xs font-semibold text-muted">Pengajar Course</p>
                <p className="text-base font-semibold text-ink">{cert.teacher_name}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
