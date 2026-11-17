import { getCurrentUser } from '@/lib/auth';
import { listAdminUsers } from '@/lib/queries/users';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Pengguna',
};

export default async function AdminUsersPage() {
  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    listAdminUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Kelola Pengguna</h1>
        <p className="text-base text-muted">
          Cari akun pengguna, kelola peran, atau hapus akun yang tidak lagi aktif.
        </p>
      </div>

      <AdminUsersClient initialUsers={users} currentAdminId={currentUser.id} />
    </div>
  );
}
