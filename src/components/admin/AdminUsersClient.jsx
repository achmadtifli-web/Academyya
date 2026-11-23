'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

function getUserDeleteGuard(u, currentAdminId) {
  if (Number(u.id) === Number(currentAdminId)) {
    return { blocked: true, reason: 'Akun Anda sendiri' };
  }

  const activeEnrollments = u.active_enrollments_count || 0;
  if (activeEnrollments > 0) {
    return {
      blocked: true,
      reason: `Sedang mengikuti ${activeEnrollments} course`,
    };
  }

  const publishedCourses = u.published_courses_count || 0;
  const activeCourseEnrollments = u.active_course_enrollments_count || 0;
  if (publishedCourses > 0 || activeCourseEnrollments > 0) {
    const parts = [];
    if (publishedCourses > 0) parts.push(`${publishedCourses} published`);
    if (activeCourseEnrollments > 0) parts.push(`${activeCourseEnrollments} siswa aktif`);
    return {
      blocked: true,
      reason: `Masih aktif (${parts.join(' · ')})`,
    };
  }

  return { blocked: false, reason: null };
}

function formatUserActivity(u) {
  if (u.role === 'teacher') {
    const total = u.courses_count || 0;
    const published = u.published_courses_count || 0;
    const activeStudents = u.active_course_enrollments_count || 0;
    if (total === 0) {
      return { primary: '0 course', secondary: null };
    }
    const details = [`${published} published`];
    if (activeStudents > 0) {
      details.push(`${activeStudents} siswa aktif`);
    }
    return { primary: `${total} course`, secondary: details.join(' · ') };
  }

  const total = u.enrollments_count || 0;
  const active = u.active_enrollments_count || 0;
  if (total === 0) {
    return { primary: '0 enrollment', secondary: null };
  }
  return {
    primary: `${total} enrollment`,
    secondary: active > 0 ? `${active} aktif` : 'Sudah selesai semua',
  };
}

export function AdminUsersClient({ initialUsers = [], currentAdminId }) {
  const router = useRouter();
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
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus pengguna.' });
      setDeleteTarget(null);
      router.refresh();
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
                  <th scope="col" className="py-4 px-5">Pengguna</th>
                  <th scope="col" className="py-4 px-5">Peran</th>
                  <th scope="col" className="py-4 px-5">Aktivitas</th>
                  <th scope="col" className="py-4 px-5 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleUsers.map((u) => {
                  const guard = getUserDeleteGuard(u, currentAdminId);
                  const activity = formatUserActivity(u);
                  const noteId = `user-delete-note-${u.id}`;
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
                      <td className="py-4 px-5 text-sm">
                        <p className="font-medium text-ink">{activity.primary}</p>
                        {activity.secondary && (
                          <p className="text-muted">{activity.secondary}</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col items-end gap-1">
                          <Button
                            variant="dangerOutline"
                            size="sm"
                            disabled={guard.blocked || busyId === u.id}
                            aria-describedby={guard.blocked ? noteId : undefined}
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span>Hapus</span>
                          </Button>
                          {guard.blocked && (
                            <span id={noteId} className="text-sm text-muted text-right">
                              {guard.reason}
                            </span>
                          )}
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
              const guard = getUserDeleteGuard(u, currentAdminId);
              const activity = formatUserActivity(u);
              const noteId = `mobile-user-delete-note-${u.id}`;
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
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="text-sm">
                      <p className="font-medium text-ink">{activity.primary}</p>
                      {activity.secondary && (
                        <p className="text-muted">{activity.secondary}</p>
                      )}
                    </div>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      disabled={guard.blocked || busyId === u.id}
                      aria-describedby={guard.blocked ? noteId : undefined}
                      onClick={() => setDeleteTarget(u)}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>Hapus</span>
                    </Button>
                  </div>
                  {guard.blocked && (
                    <p id={noteId} className="text-sm text-muted">
                      Tidak dapat dihapus: {guard.reason}
                    </p>
                  )}
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
