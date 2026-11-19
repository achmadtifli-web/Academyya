import { RegisterFormClient } from '@/components/auth/RegisterFormClient';

export const metadata = {
  title: 'Daftar Akun',
};

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const initialType = params?.type === 'teacher' ? 'teacher' : 'student';
  const callbackUrl = typeof params?.callbackUrl === 'string' ? params.callbackUrl : '';

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 bg-page">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-line p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
            Buat Akun Academyya
          </h1>
          <p className="text-base text-muted">
            Pilih peran pendaftaran di bawah ini dan lengkapi data Anda.
          </p>
        </div>

        <RegisterFormClient initialType={initialType} callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
