import { redirectAuthenticatedFromAuthPage } from '@/lib/pageAuth';
import { LoginFormClient } from '@/components/auth/LoginFormClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Masuk Akun',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const callbackUrl = typeof params?.callbackUrl === 'string' ? params.callbackUrl : '';
  const authPath = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/login';
  await redirectAuthenticatedFromAuthPage(authPath);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 bg-page">
      <div className="w-full max-w-md rounded-3xl bg-white border border-line p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
            Masuk ke Academyya
          </h1>
          <p className="text-base text-muted">
            Masukkan email dan kata sandi akun Anda untuk melanjutkan.
          </p>
        </div>

        <LoginFormClient callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
