'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InputField, TextareaField } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastContext';

export function ProfileClient({ initialUser, initialApplications = [] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name || '');
  const [bio, setBio] = useState(initialUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatar_url || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [applications, setApplications] = useState(initialApplications);
  const [expertise, setExpertise] = useState('');
  const [motivation, setMotivation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [appErrors, setAppErrors] = useState({});
  const [submittingApp, setSubmittingApp] = useState(false);

  const hasPendingApp = applications.some((a) => a.status === 'pending');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFieldErrors({});
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          avatar_url: avatarUrl,
          currentPassword,
          newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal menyimpan profil.');
      }

      setUser(json.data.user);
      setCurrentPassword('');
      setNewPassword('');
      showToast({ type: 'success', message: json.message });
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menyimpan profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApplyTeacher = async (e) => {
    e.preventDefault();
    setSubmittingApp(true);
    setAppErrors({});
    try {
      const res = await fetch('/api/teacher-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertise,
          motivation,
          portfolio_url: portfolioUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setAppErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal mengirim pengajuan Teacher.');
      }

      setApplications((prev) => [json.data.application, ...prev]);
      setExpertise('');
      setMotivation('');
      setPortfolioUrl('');
      showToast({ type: 'success', message: json.message });
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal mengirim pengajuan Teacher.' });
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* Left Preview Card */}
      <div className="lg:col-span-4 space-y-5">
        <div className="rounded-3xl bg-white border border-line p-6 text-center space-y-4">
          <Avatar
            src={user.avatar_url}
            name={user.name}
            size="xl"
            alt={`Foto profil ${user.name}`}
            className="mx-auto border-2 border-primary/20"
          />
          <div className="space-y-1.5">
            <h2 className="font-heading text-xl font-bold text-ink">{user.name}</h2>
            <p className="text-sm text-muted break-all">{user.email}</p>
            <div className="pt-1 flex justify-center">
              <StatusBadge status={user.role} />
            </div>
          </div>
          {user.bio && <p className="text-sm text-muted leading-relaxed">{user.bio}</p>}
        </div>

        {/* Teacher Application History */}
        {applications.length > 0 && (
          <div className="rounded-3xl bg-white border border-line p-6 space-y-3">
            <h3 className="font-heading text-base font-semibold text-ink">
              Riwayat Pengajuan Teacher
            </h3>
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="rounded-2xl border border-line bg-page p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{app.expertise}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  {app.review_note && (
                    <p className="text-sm text-muted">Catatan: {app.review_note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Edit Forms */}
      <div className="lg:col-span-8 space-y-6">
        <form
          onSubmit={handleSaveProfile}
          className="rounded-3xl bg-white border border-line p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-heading text-xl font-semibold text-ink">
            Informasi Profil & Kata Sandi
          </h2>

          <InputField
            id="profile-name"
            label="Nama Lengkap"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />

          <InputField
            id="profile-avatar"
            label="URL Foto Profil (Opsional)"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            error={fieldErrors.avatar_url}
            placeholder="https://example.com/avatar.jpg"
          />

          <TextareaField
            id="profile-bio"
            label="Biografi Singkat"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ceritakan singkat tentang diri atau minat belajar Anda..."
          />

          <div className="pt-4 border-t border-line space-y-4">
            <h3 className="font-heading text-base font-semibold text-ink">
              Ganti Kata Sandi (Opsional)
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField
                id="profile-current-password"
                label="Kata Sandi Saat Ini"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={fieldErrors.currentPassword}
              />
              <InputField
                id="profile-new-password"
                label="Kata Sandi Baru (Minimal 8 karakter)"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={fieldErrors.newPassword}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={savingProfile}>
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{savingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </Button>
          </div>
        </form>

        {/* Student-only Apply to become Teacher section */}
        {user.role === 'student' && !hasPendingApp && (
          <form
            onSubmit={handleApplyTeacher}
            className="rounded-3xl bg-white border border-line p-6 sm:p-8 space-y-5"
          >
            <div>
              <h2 className="font-heading text-xl font-semibold text-ink">
                Ajukan Diri Menjadi Teacher
              </h2>
              <p className="mt-1 text-base text-muted">
                Bagikan keahlian Anda dengan membuat course terstruktur di Academyya. Pengajuan akan diverifikasi oleh Admin.
              </p>
            </div>

            <InputField
              id="apply-expertise"
              label="Bidang Keahlian"
              required
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              error={appErrors.expertise}
              placeholder="Contoh: Desain UI/UX & Aksesibilitas"
            />
            <TextareaField
              id="apply-motivation"
              label="Motivasi Mengajar"
              required
              rows={3}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              error={appErrors.motivation}
              placeholder="Jelaskan pengalaman dan topik materi yang akan Anda ajarkan..."
            />
            <InputField
              id="apply-portfolio"
              label="Tautan Portofolio (Opsional)"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              error={appErrors.portfolio_url}
              placeholder="https://github.com/username"
            />

            <div className="flex justify-end">
              <Button type="submit" variant="outline" loading={submittingApp}>
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{submittingApp ? 'Mengirim...' : 'Kirim Pengajuan Teacher'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
