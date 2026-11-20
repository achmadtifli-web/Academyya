'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

const FAQ_ITEMS = [
  {
    id: 'cara-mulai',
    question: 'Bagaimana cara mulai mengikuti course di Academyya?',
    answer:
      'Buka halaman Katalog untuk mencari kelas berdasarkan kata kunci, kategori, atau level (Pemula, Menengah, maupun Lanjut). Setelah masuk ke akun Student, klik tombol Ikuti Course Sekarang pada halaman detail kelas untuk langsung mengakses materi belajar.',
  },
  {
    id: 'progres-belajar',
    question: 'Apakah progres belajar saya tersimpan secara otomatis?',
    answer:
      'Ya. Setiap materi dapat ditandai selesai menggunakan tombol Mark as Done di ruang belajar. Persentase progres Anda dihitung otomatis dan tersimpan di dasbor My Learning agar Anda bisa melanjutkan dari materi terakhir kapan saja.',
  },
  {
    id: 'sertifikat-digital',
    question: 'Bagaimana cara memperoleh sertifikat kelulusan digital?',
    answer:
      'Sertifikat kelulusan diterbitkan otomatis setelah Anda menyelesaikan 100% seluruh materi dalam sebuah course. Anda dapat membuka halaman Sertifikat Saya untuk melihat kode verifikasi unik serta mencetak atau menyimpannya sebagai PDF.',
  },
  {
    id: 'diskusi-materi',
    question: 'Apakah saya bisa bertanya kepada pengajar jika ada materi yang sulit?',
    answer:
      'Bisa. Setiap materi memiliki forum diskusi khusus tempat siswa terdaftar dapat mengajukan pertanyaan baru dan membalas utas diskusi, sehingga pengajar maupun peserta lain dapat memberikan penjelasan sesuai topik materi.',
  },
  {
    id: 'daftar-teacher',
    question: 'Bagaimana alur pendaftaran menjadi Teacher di Academyya?',
    answer:
      'Pilih tab Daftar Teacher saat registrasi atau ajukan melalui halaman Profil Saya dengan mengisi bidang keahlian, motivasi mengajar, serta tautan portofolio bila ada. Akun aktif sebagai Student terlebih dahulu hingga Admin meninjau dan menyetujui pengajuan Anda.',
  },
  {
    id: 'kelola-draft',
    question: 'Bisakah pengajar menyusun materi dulu sebelum kelas tampil di katalog?',
    answer:
      'Tentu. Setiap course baru yang dibuat pengajar otomatis berstatus Draft dan belum terlihat publik. Setelah seluruh materi selesai disusun dan diurutkan, pengajar cukup mengaktifkan toggle Published pada halaman Kelola Course.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-white py-16 border-t border-line scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 space-y-3">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink leading-snug">
            Pertanyaan yang <HighlightUnderline>Sering Diajukan</HighlightUnderline>
          </h2>
          <p className="text-base text-muted leading-relaxed">
            Informasi ringkas seputar cara mengikuti kelas, pelacakan progres materi, sertifikat digital, dan pendaftaran pengajar di Academyya.
          </p>
        </div>

        <div className="lg:col-span-7 space-y-3 min-w-0">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-trigger-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-colors ${
                  isOpen
                    ? 'bg-white border-primary/40 shadow-xs'
                    : 'bg-page border-line hover:border-line-strong hover:bg-white'
                }`}
              >
                <h3 className="m-0">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="w-full min-h-14 px-5 py-4 flex items-center justify-between gap-4 text-left font-heading font-semibold text-base sm:text-lg text-ink leading-snug rounded-2xl"
                  >
                    <span className="min-w-0">{item.question}</span>
                    <span
                      aria-hidden="true"
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                        isOpen
                          ? 'bg-primary-light border-primary/30 text-primary-dark'
                          : 'bg-white border-line text-muted'
                      }`}
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-5 pb-5 pt-0 text-base text-muted leading-relaxed"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
