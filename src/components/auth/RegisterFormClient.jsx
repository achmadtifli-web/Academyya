'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Info, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField, TextareaField } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContext';

export function RegisterFormClient({ initialType = 'student', callbackUrl = '' }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [accountType, setAccountType] = useState(
    initialType === 'teacher' ? 'teacher' : 'student'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expertise, setExpertise] = useState('');
  const [motivation, setMotivation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          accountType,
          expertise,
          motivation,
          portfolio_url: portfolioUrl,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        setError(json.error || 'Pendaftaran gagal. Periksa kembali data Anda.');
        setSubmitting(false);
        return;
      }

      showToast({ type: 'success', message: json.message });
      const safeTarget =
        callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
          ? callbackUrl
          : '/dashboard';
      router.push(safeTarget);
      router.refresh();
    } catch {
      setError('Terjadi gangguan jaringan saat mendaftar.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Pill Segmented Role Switcher */}
      <div
        role="tablist"
        aria-label="Pilih tipe akun pendaftaran"
        className="grid grid-cols-2 rounded-full bg-page p-1.5 border border-line"
      >
        <button
          type="button"
          role="tab"
          aria-selected={accountType === 'student'}
          onClick={() => setAccountType('student')}
          className={`min-h-11 px-4 rounded-full text-sm sm:text-base font-semibold transition ${
            accountType === 'student'
              ? 'bg-primary-hover text-white shadow-xs'
              : 'text-ink hover:bg-white'
          }`}
        >
          Daftar Student
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={accountType === 'teacher'}
          onClick={() => setAccountType('teacher')}
          className={`min-h-11 px-4 rounded-full text-sm sm:text-base font-semibold transition ${
            accountType === 'teacher'
              ? 'bg-primary-hover text-white shadow-xs'
              : 'text-ink hover:bg-white'
          }`}
        >
          Daftar Teacher
        </button>
      </div>

      {accountType === 'teacher' && (
        <div className="rounded-2xl border border-primary/30 bg-primary-light/70 p-4 flex items-start gap-3 text-sm text-primary-dark">
          <Info className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            Calon Teacher akan aktif sebagai akun Student terlebih dahulu sampai Admin memverifikasi dan menyetujui pengajuan Anda.
          </p>
        </div>
      )}

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
        id="register-name"
        label="Nama Lengkap"
        required
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
        placeholder="Masukkan nama lengkap Anda"
      />

      <InputField
        id="register-email"
        label="Alamat Email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        placeholder="nama@email.com"
      />

      <InputField
        id="register-password"
        label="Kata Sandi"
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        hint="Minimal 8 karakter."
        placeholder="Buat kata sandi minimal 8 karakter"
      />

      {accountType === 'teacher' && (
        <div className="space-y-4 pt-2 border-t border-line">
          <InputField
            id="register-expertise"
            label="Bidang Keahlian"
            required
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            error={fieldErrors.expertise}
            placeholder="Contoh: Pemrograman Web & Basis Data"
          />

          <TextareaField
            id="register-motivation"
            label="Motivasi & Rencana Mengajar"
            required
            rows={3}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            error={fieldErrors.motivation}
            placeholder="Ceritakan pengalaman dan topik yang ingin Anda bagikan kepada siswa..."
          />

          <InputField
            id="register-portfolio"
            label="Link Portofolio / LinkedIn / GitHub (Opsional)"
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            error={fieldErrors.portfolio_url}
            placeholder="https://github.com/username"
          />
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
        <UserPlus className="w-5 h-5" aria-hidden="true" />
        <span>
          {submitting
            ? 'Mendaftarkan Akun...'
            : accountType === 'teacher'
            ? 'Kirim Pendaftaran Teacher'
            : 'Buat Akun Student'}
        </span>
      </Button>

      <p className="text-center text-base text-muted pt-1">
        Sudah punya akun?{' '}
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'}
          className="min-h-11 inline-flex items-center font-semibold text-primary-dark hover:underline"
        >
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
