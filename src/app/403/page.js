import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Akses Ditolak (403)',
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-12">
      <main className="max-w-lg w-full rounded-3xl bg-white border border-line p-8 sm:p-10 text-center space-y-5 shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-danger-light text-danger-ink flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-ink">
          Akses Tidak Diizinkan (403)
        </h1>
        <p className="text-base text-muted leading-relaxed">
          Peran akun Anda tidak memiliki izin untuk membuka halaman ini. Jika Anda baru saja mendaftar sebagai Teacher, tunggu Admin menyetujui pengajuan Anda terlebih dahulu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button href="/" variant="primary">
            Ke Beranda
          </Button>
          <Button href="/dashboard" variant="outline">
            Ke My Learning
          </Button>
        </div>
      </main>
    </div>
  );
}
