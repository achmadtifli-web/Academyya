'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContext';

function getSafeRedirect(callbackUrl, role) {
  if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
    return callbackUrl;
  }
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/dashboard';
}

export function LoginFormClient({ callbackUrl = '' }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Email atau kata sandi salah.');
        setSubmitting(false);
        return;
      }

      const target = getSafeRedirect(callbackUrl, json.data.user.role);
      showToast({ type: 'success', message: 'Berhasil masuk. Selamat datang kembali!' });
      router.push(target);
      router.refresh();
    } catch {
      setError('Gagal terhubung ke server. Coba beberapa saat lagi.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger-light p-4 flex items-start gap-3 text-sm font-medium text-danger-ink"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <InputField
        id="login-email"
        label="Alamat Email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@email.com"
      />

      <InputField
        id="login-password"
        label="Kata Sandi"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Masukkan kata sandi Anda"
      />

      <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
        <LogIn className="w-5 h-5" aria-hidden="true" />
        <span>{submitting ? 'Memproses...' : 'Masuk ke Akun'}</span>
      </Button>

      <p className="text-center text-base text-muted pt-2">
        Belum memiliki akun?{' '}
        <Link
          href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/register'}
          className="min-h-11 inline-flex items-center font-semibold text-primary-dark hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
}
