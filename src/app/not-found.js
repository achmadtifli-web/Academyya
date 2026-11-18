import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-12">
      <main className="max-w-lg w-full rounded-3xl bg-white border border-line p-8 sm:p-10 text-center space-y-5 shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary-light text-primary-dark flex items-center justify-center">
          <SearchX className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-ink">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-base text-muted leading-relaxed">
          Halaman atau materi yang Anda cari tidak tersedia atau mungkin sudah dipindahkan.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button href="/" variant="primary">
            Kembali ke Beranda
          </Button>
          <Button href="/courses" variant="outline">
            Jelajahi Katalog
          </Button>
        </div>
      </main>
    </div>
  );
}
