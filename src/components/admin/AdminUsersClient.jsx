'use client';

import { useState } from 'react';
import { Search, Trash2, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

export function AdminUsersClient({ initialUsers = [], currentAdminId }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const visibleUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const term = q.trim().toLowerCase();
    const matchQ =
      !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    return matchRole && matchQ;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus pengguna.');
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      showToast({ type: 'success', message: json.message });
      setDeleteTarget(null);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus pengguna.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="admin-user-search" className="sr-only">
            Cari nama atau email pengguna
          </label>
          <Search
            className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="admin-user-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full min-h-11 pl-12 pr-4 rounded-full border border-line-strong bg-white text-base text-ink"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'student', label: 'Student' },
            { value: 'teacher', label: 'Teacher' },
            { value: 'admin', label: 'Admin' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRoleFilter(tab.value)}
              className={`min-h-11 px-4 rounded-full text-sm font-semibold border transition ${
                roleFilter === tab.value
                  ? 'bg-primary-hover text-white border-primary-hover'
                  : 'bg-white text-ink border-line hover:border-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {visibleUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Pengguna tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau pilih filter peran lainnya."
        />
      ) : (
        <>
          <div className="hidden md:block rounded-3xl bg-white border border-line overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-page border-b border-line text-sm font-semibold text-muted">
                <tr>
                  <th className="py-4 px-5">Pengguna</th>
                  <th className="py-4 px-5">Peran</th>
                  <th className="py-4 px-5">Aktivitas</th>
                  <th className="py-4 px-5 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleUsers.map((u) => {
                  const isSelf = Number(u.id) === Number(currentAdminId);
                  return (
                    <tr key={u.id} className="hover:bg-page/50">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={u.avatar_url} name={u.name} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate">{u.name}</p>
                            <p className="text-sm text-muted truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={u.role} />
                      </td>
                      <td className="py-4 px-5 text-sm text-muted">
                        {u.role === 'teacher'
                          ? `${u.courses_count} course`
                          : `${u.enrollments_count} enrollment`}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="dangerOutline"
                            size="sm"
                            disabled={isSelf || busyId === u.id}
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span>Hapus</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {visibleUsers.map((u) => {
              const isSelf = Number(u.id) === Number(currentAdminId);
              return (
                <div key={u.id} className="rounded-3xl bg-white border border-line p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={u.avatar_url} name={u.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{u.name}</p>
                        <p className="text-sm text-muted truncate">{u.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={u.role} />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-sm text-muted">
                      {u.role === 'teacher'
                        ? `${u.courses_count} course`
                        : `${u.enrollments_count} enrollment`}
                    </span>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      disabled={isSelf || busyId === u.id}
                      onClick={() => setDeleteTarget(u)}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>Hapus</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Akun Pengguna?"
        message={
          deleteTarget
            ? `Akun ${deleteTarget.name} (${deleteTarget.email}) beserta seluruh data terkaitnya akan dihapus permanen.`
            : ''
        }
        confirmLabel="Ya, Hapus Akun"
        loading={busyId === deleteTarget?.id}
      />
    </div>
  );
}
