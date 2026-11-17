import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { FontSizeProvider } from '@/components/ui/FontSizeContext';
import { ToastProvider } from '@/components/ui/ToastContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Academyya: Learn Skills. Build Your Future.',
    template: '%s | Academyya',
  },
  description:
    'Platform kursus online terstruktur dari pengajar terverifikasi dengan pelacakan progres, forum diskusi materi, dan sertifikat digital.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${poppins.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-page text-ink">
        <FontSizeProvider>
          <ToastProvider>{children}</ToastProvider>
        </FontSizeProvider>
      </body>
    </html>
  );
}
