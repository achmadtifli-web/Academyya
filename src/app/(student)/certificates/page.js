import { Award, Calendar } from 'lucide-react';
import { requirePageUser } from '@/lib/pageAuth';
import { listStudentCertificates } from '@/lib/queries/certificates';
import { AppFrame } from '@/components/layout/AppFrame';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sertifikat Saya',
};

export default async function CertificatesListPage() {
  const user = await requirePageUser({ callbackUrl: '/certificates' });

  const certificates = await listStudentCertificates(user.id);

  return (
    <AppFrame user={user}>
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Sertifikat <HighlightUnderline>Kelulusan</HighlightUnderline> Saya
          </h1>
          <p className="text-base text-muted">
            Setiap course yang diselesaikan 100% menerbitkan sertifikat digital resmi dengan kode verifikasi unik.
          </p>
        </div>

        {certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Belum ada sertifikat yang diterbitkan"
            description="Selesaikan seluruh materi pada course yang Anda ikuti hingga 100% untuk memperoleh sertifikat kelulusan digital."
            actionLabel="Lihat Course Saya"
            actionHref="/dashboard"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <article
                key={cert.id}
                className="rounded-3xl bg-white border border-line p-6 flex flex-col gap-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="w-12 h-12 rounded-2xl bg-success-light text-success flex items-center justify-center">
                    <Award className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-primary-light text-primary-dark px-3 py-1 text-xs font-bold">
                    {cert.certificate_code}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-heading text-lg font-semibold text-ink">
                    {cert.course_title}
                  </h2>
                  <p className="text-sm text-muted">Pengajar: {cert.teacher_name}</p>
                </div>

                <p className="text-sm text-muted inline-flex items-center gap-1.5 mt-auto">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>
                    Terbit{' '}
                    {new Date(cert.issued_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </p>

                <Button href={`/certificates/${cert.certificate_code}`} variant="primary" className="w-full">
                  Buka & Cetak Sertifikat
                </Button>
              </article>
            ))}
          </div>
        )}
      </main>
    </AppFrame>
  );
}
