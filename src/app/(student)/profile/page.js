import { requirePageUser } from '@/lib/pageAuth';
import { getUserTeacherApplications } from '@/lib/queries/users';
import { AppFrame } from '@/components/layout/AppFrame';
import { ProfileClient } from '@/components/student/ProfileClient';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Profil Saya',
};

export default async function ProfilePage() {
  const user = await requirePageUser({ callbackUrl: '/profile' });

  const applications = await getUserTeacherApplications(user.id);

  return (
    <AppFrame user={user}>
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Pengaturan <HighlightUnderline>Profil</HighlightUnderline>
          </h1>
          <p className="text-base text-muted">
            Kelola informasi pribadi, kata sandi akun, dan status pengajuan pengajar Anda.
          </p>
        </div>

        <ProfileClient initialUser={user} initialApplications={applications} />
      </main>
    </AppFrame>
  );
}
