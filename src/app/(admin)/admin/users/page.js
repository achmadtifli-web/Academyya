import { requirePageUser } from '@/lib/pageAuth';
import { listAdminUsers } from '@/lib/queries/users';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Pengguna',
};

export default async function AdminUsersPage({ searchParams }) {
  const params = await searchParams;
  const q = typeof params?.q === 'string' ? params.q : '';
  const filter = typeof params?.filter === 'string' ? params.filter : 'all';
  const page = Number(params?.page) || 1;

  const [currentUser, usersResult] = await Promise.all([
    requirePageUser({ callbackUrl: '/admin/users', roles: ['admin'] }),
    listAdminUsers({ q, filter, page, limit: 5 }),
  ]);

  const initialUsers = Array.isArray(usersResult?.users)
    ? usersResult.users
    : Array.isArray(usersResult)
    ? usersResult
    : [];
  const initialPagination = usersResult?.pagination || {
    page,
    limit: 5,
    total: initialUsers.length,
    totalPages: Math.max(1, Math.ceil(initialUsers.length / 5)),
  };
  const initialPendingCount = Number(usersResult?.pendingTeacherCount || 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Kelola Pengguna</h1>
        <p className="text-base text-muted">
          Kelola akun pengguna, pantau pelamar Teacher yang masih menunggu verifikasi, atau ubah peran pengguna.
        </p>
      </div>

      <AdminUsersClient
        initialUsers={initialUsers}
        initialPagination={initialPagination}
        initialPendingCount={initialPendingCount}
        initialQuery={q}
        initialFilter={filter}
        currentAdminId={currentUser.id}
      />
    </div>
  );
}
