import { LoginFormClient } from '@/components/auth/LoginFormClient';
import { HeroVisual } from '@/components/layout/HeroVisual';
import { StatStrip } from '@/components/ui/StatStrip';

export const metadata = {
  title: 'Masuk Akun',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const callbackUrl = typeof params?.callbackUrl === 'string' ? params.callbackUrl : '';

  return (
    <main className="flex-1 min-h-[calc(100vh-5rem)] grid lg:grid-cols-12">
      <div className="hidden lg:flex lg:col-span-5 bg-page border-r border-line p-10 xl:p-12 flex-col justify-between">
        <div className="space-y-3">
          <h2 className="font-heading text-3xl font-bold text-ink leading-tight">
            Mulai Perjalanan Belajarmu Hari Ini
          </h2>
          <p className="text-base text-muted leading-relaxed">
            Lanjutkan materi terakhir Anda, diskusikan topik bersama pengajar, dan pantau progres hingga sertifikat terbit.
          </p>
        </div>

        <div className="py-6">
          <HeroVisual compact />
        </div>

        <StatStrip
          items={[
            { value: '100%', label: 'Materi Terstruktur' },
            { value: 'Resmi', label: 'Pengajar Terverifikasi' },
            { value: 'Gratis', label: 'Sertifikat Digital' },
          ]}
        />
      </div>

      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-ink">
              Masuk ke Academyya
            </h1>
            <p className="text-base text-muted">
              Masukkan email dan kata sandi akun Anda untuk melanjutkan.
            </p>
          </div>

          <LoginFormClient callbackUrl={callbackUrl} />
        </div>
      </div>
    </main>
  );
}
