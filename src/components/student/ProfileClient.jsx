'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Save, Trash2, Upload, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InputField, TextareaField } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { useToast } from '@/components/ui/ToastContext';
import { useImageUploadField } from '@/lib/useImageUploadField';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileClient({ initialUser, initialApplications = [] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name || '');
  const [bio, setBio] = useState(initialUser.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const applications = initialApplications;

  const {
    fileInputRef,
    selectedFile,
    localPreviewUrl,
    removeImage: removeAvatar,
    setRemoveImage: setRemoveAvatar,
    handleFileChange,
    handleCancelSelectedFile,
    handleRemoveImage: handleRemoveAvatar,
  } = useImageUploadField({
    maxBytes: MAX_AVATAR_BYTES,
    sizeErrorMessage: 'Ukuran foto profil maksimal 2 MB.',
    onError: (msg) => setFieldErrors((prev) => ({ ...prev, avatar: msg })),
    onClearError: () => {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });
    },
  });

  const activeAvatarSrc = localPreviewUrl
    ? localPreviewUrl
    : removeAvatar
    ? null
    : user.avatar_url;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFieldErrors({});
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
      formData.append('removeAvatar', removeAvatar ? 'true' : 'false');
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal menyimpan profil.');
      }

      setUser(json.data.user);
      handleCancelSelectedFile();
      setRemoveAvatar(false);
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

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* Left Preview Card */}
      <div className="lg:col-span-4 space-y-5">
        <div className="rounded-3xl bg-white border border-line p-6 text-center space-y-4">
          <Avatar
            src={activeAvatarSrc}
            name={name || user.name}
            size="xl"
            alt={`Foto profil ${name || user.name}`}
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
                  {app.cv_url && (
                    <a
                      href={app.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-dark hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Lihat CV yang Diunggah</span>
                    </a>
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

          {/* File Upload for Profile Photo */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-ink">
              Foto Profil (Opsional)
            </span>
            <div className="rounded-2xl border border-line bg-page p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar
                src={activeAvatarSrc}
                name={name || user.name}
                size="lg"
                className="border border-line-strong"
              />

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    id="profile-avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    aria-describedby={fieldErrors.avatar ? 'profile-avatar-error' : 'profile-avatar-hint'}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor="profile-avatar"
                    className="min-h-11 px-4 rounded-full bg-white text-primary-dark border-2 border-primary-hover hover:bg-primary-light/60 font-semibold text-sm inline-flex items-center gap-2 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-hover"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>{activeAvatarSrc ? 'Ganti Foto' : 'Unggah Foto'}</span>
                  </label>

                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelSelectedFile}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                      <span>Batal Pilih</span>
                    </Button>
                  )}

                  {activeAvatarSrc && !selectedFile && (
                    <Button
                      type="button"
                      variant="dangerOutline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>Hapus Foto</span>
                    </Button>
                  )}
                </div>

                {selectedFile ? (
                  <p className="text-sm font-medium text-ink truncate">
                    File dipilih: {selectedFile.name} (klik Simpan Profil untuk menerapkan)
                  </p>
                ) : removeAvatar ? (
                  <p className="text-sm font-medium text-muted">
                    Foto profil akan dihapus saat Anda menekan Simpan Profil.
                  </p>
                ) : (
                  <p id="profile-avatar-hint" className="text-sm text-muted">
                    Unggah gambar berformat JPG, PNG, atau WebP (maksimal 2 MB).
                  </p>
                )}
              </div>
            </div>
            {fieldErrors.avatar && (
              <p
                id="profile-avatar-error"
                className="text-sm text-danger-ink font-medium flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{fieldErrors.avatar}</span>
              </p>
            )}
          </div>

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
              <PasswordField
                id="profile-current-password"
                label="Kata Sandi Saat Ini"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={fieldErrors.currentPassword}
              />
              <PasswordField
                id="profile-new-password"
                label="Kata Sandi Baru (Minimal 8 karakter)"
                autoComplete="new-password"
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
      </div>
    </div>
  );
}
