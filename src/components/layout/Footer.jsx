import Link from 'next/link';

export function Footer() {
  return (
    <footer className="no-print mt-auto bg-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <Link href="/" className="min-h-11 inline-flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-full bg-white text-primary-dark font-heading font-bold text-base flex items-center justify-center">
                Ac
              </span>
              <span className="font-heading font-bold text-xl text-white">
                Academyya
              </span>
            </Link>
            <p className="text-base text-blue-100 max-w-md leading-relaxed">
              Learn Skills. Build Your Future. Platform pembelajaran terstruktur dengan
              pengajar terverifikasi, pelacakan progres materi, diskusi aktif, dan sertifikat digital.
            </p>
          </div>
          <div className="text-sm text-blue-100 md:text-right space-y-1.5">
            <p>© {new Date().getFullYear()} Academyya LMS. Seluruh hak cipta dilindungi.</p>
            <p>Dirancang ramah untuk pelajar pemula hingga senior.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
