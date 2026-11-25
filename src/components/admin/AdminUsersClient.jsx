'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { validateAdminUserPayload } from '@/lib/validators';

const DEFAULT_PAGINATION = { page: 1, limit: 5, total: 0, totalPages: 1 };

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
];

const FIELD_INPUT_IDS = {
  name: 'admin-user-name',
  email: 'admin-user-email',
  password: 'admin-user-password',
  role: 'admin-user-role-student',
};

function formatApprovedAt(timestamp) {
  if (!timestamp) return null;
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(timestamp));
  } catch {
    return null;
  }
}

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

  if (u.role === 'admin') {
    return { primary: 'Administrator', secondary: null };
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

function focusFirstUserError(errors) {
  const firstKey = Object.keys(FIELD_INPUT_IDS).find((key) => errors[key]);
  if (!firstKey || typeof document === 'undefined') return;
  if (firstKey === 'role') {
    document.querySelector('input[name="role"]:not(:disabled)')?.focus();
    return;
  }
  document.getElementById(FIELD_INPUT_IDS[firstKey])?.focus();
}

export function AdminUsersClient({
  initialUsers = [],
  initialPagination = { page: 1, limit: 5, total: 0, totalPages: 1 },
  initialPendingCount = 0,
  initialQuery = '',
  initialFilter = 'all',
  currentAdminId,
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const dialogRef = useRef(null);
  const fetchAbortRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const [users, setUsers] = useState(
    Array.isArray(initialUsers) ? initialUsers : []
  );
  const [pagination, setPagination] = useState(
    initialPagination && typeof initialPagination === 'object'
      ? { ...DEFAULT_PAGINATION, ...initialPagination }
      : DEFAULT_PAGINATION
  );
  const [pendingCount, setPendingCount] = useState(Number(initialPendingCount) || 0);
  const [q, setQ] = useState(typeof initialQuery === 'string' ? initialQuery : '');
  const [filter, setFilter] = useState(
    typeof initialFilter === 'string' ? initialFilter : 'all'
  );
  const [loadingList, setLoadingList] = useState(false);

  const safeUsers = Array.isArray(users) ? users : [];
  const safePagination =
    pagination && typeof pagination === 'object'
      ? {
          page: Math.max(1, Number(pagination.page) || 1),
          limit: Math.max(1, Number(pagination.limit) || 5),
          total: Math.max(0, Number(pagination.total) || 0),
          totalPages: Math.max(1, Number(pagination.totalPages) || 1),
        }
      : DEFAULT_PAGINATION;
  const safePendingCount = Number(pendingCount) || 0;
  const safeQ = typeof q === 'string' ? q : '';
  const safeFilter = typeof filter === 'string' ? filter : 'all';

  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [fieldErrors, setFieldErrors] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (formOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector('#admin-user-name')?.focus();
    } else if (!formOpen && dialog.open) {
      dialog.close();
    }
  }, [formOpen]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      fetchAbortRef.current?.abort();
    };
  }, []);

  const fetchUsersPage = async ({
    nextQ = safeQ,
    nextFilter = safeFilter,
    nextPage = safePagination.page,
  } = {}) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoadingList(true);

    try {
      const params = new URLSearchParams();
      params.set('page', String(Math.max(1, Number(nextPage) || 1)));
      params.set('limit', String(safePagination.limit || 5));
      if (String(nextQ).trim()) params.set('q', String(nextQ).trim());
      if (nextFilter && nextFilter !== 'all') params.set('filter', nextFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat daftar pengguna.');
      }

      setUsers(Array.isArray(json.data?.users) ? json.data.users : []);
      setPagination(
        json.data?.pagination && typeof json.data.pagination === 'object'
          ? { ...DEFAULT_PAGINATION, ...json.data.pagination }
          : DEFAULT_PAGINATION
      );
      if (typeof json.data?.pendingTeacherCount === 'number') {
        setPendingCount(json.data.pendingTeacherCount);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      showToast({ type: 'error', message: err.message || 'Gagal memuat daftar pengguna.' });
    } finally {
      if (fetchAbortRef.current === controller) {
        setLoadingList(false);
      }
    }
  };

  const handleSearchChange = (value) => {
    setQ(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchUsersPage({ nextQ: value, nextFilter: safeFilter, nextPage: 1 });
    }, 250);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    fetchUsersPage({ nextQ: safeQ, nextFilter: safeFilter, nextPage: 1 });
  };

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    fetchUsersPage({ nextQ: safeQ, nextFilter, nextPage: 1 });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('student');
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setName(u.name || '');
    setEmail(u.email || '');
    setPassword('');
    setShowPassword(false);
    setRole(u.role || 'student');
    setFieldErrors({});
    setFormOpen(true);
  };

  const clearFieldError = (field) => {
    if (!fieldErrors[field]) return;
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const isEditing = Boolean(editingUser);
    const clientValidation = validateAdminUserPayload(
      { name, email, password, role },
      { isEditing }
    );

    if (!clientValidation.valid) {
      setFieldErrors(clientValidation.fieldErrors);
      focusFirstUserError(clientValidation.fieldErrors);
      return;
    }

    setSavingUser(true);
    setFieldErrors({});

    try {
      const url = isEditing ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientValidation.data.name,
          email: clientValidation.data.email,
          password: password || undefined,
          role: clientValidation.data.role,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) {
          setFieldErrors(json.fieldErrors);
          focusFirstUserError(json.fieldErrors);
        }
        throw new Error(json.error || 'Gagal menyimpan data pengguna.');
      }

      showToast({ type: 'success', message: json.message });
      setFormOpen(false);
      await fetchUsersPage({
        nextQ: safeQ,
        nextFilter: safeFilter,
        nextPage: isEditing ? safePagination.page : 1,
      });
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menyimpan data pengguna.' });
    } finally {
      setSavingUser(false);
    }
  };

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

      showToast({ type: 'success', message: json.message });
      setDeleteTarget(null);
      await fetchUsersPage({ nextQ: safeQ, nextFilter: safeFilter, nextPage: safePagination.page });
      router.refresh();
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus pengguna.' });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const isEditingSelf = editingUser && Number(editingUser.id) === Number(currentAdminId);
  const startItem =
    safePagination.total === 0 ? 0 : (safePagination.page - 1) * safePagination.limit + 1;
  const endItem = Math.min(safePagination.total, safePagination.page * safePagination.limit);

  const filterTabs = [
    { value: 'all', label: 'Semua' },
    {
      value: 'pending',
      label: safePendingCount > 0 ? `Pending Teacher (${safePendingCount})` : 'Pending Teacher',
    },
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <search className="flex flex-col sm:flex-row flex-1 gap-3 sm:items-center">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <label htmlFor="admin-user-search" className="sr-only">
              Cari username atau email pengguna
            </label>
            <Search
              className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="admin-user-search"
              name="q"
              type="search"
              value={safeQ}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari username atau email..."
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="search"
              className="w-full min-h-11 pl-12 pr-4 rounded-full border border-line-strong bg-white text-base text-ink"
            />
          </form>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter peran pengguna">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={safeFilter === tab.value}
                onClick={() => handleFilterChange(tab.value)}
                className={`min-h-11 px-4 rounded-full text-sm font-semibold border transition ${
                  safeFilter === tab.value
                    ? 'bg-primary-hover text-white border-primary-hover'
                    : tab.value === 'pending' && safePendingCount > 0
                    ? 'bg-accent-light text-ink border-accent-dark/40 hover:border-primary'
                    : 'bg-white text-ink border-line hover:border-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </search>

        <div className="shrink-0">
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {safeUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Pengguna tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau pilih filter peran lainnya."
        />
      ) : (
        <>
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="admin-users-table-caption"
            className={`hidden md:block rounded-3xl bg-white border border-line overflow-x-auto transition-opacity ${
              loadingList ? 'opacity-65' : ''
            }`}
          >
            <table className="w-full text-left border-collapse">
              <caption id="admin-users-table-caption" className="sr-only">
                Daftar seluruh pengguna Academyya dan pelamar Teacher yang menunggu verifikasi
              </caption>
              <thead className="bg-page border-b border-line text-sm font-semibold text-muted">
                <tr>
                  <th scope="col" className="py-4 px-5">Pengguna</th>
                  <th scope="col" className="py-4 px-5">Peran &amp; Status</th>
                  <th scope="col" className="py-4 px-5">Aktivitas</th>
                  <th scope="col" className="py-4 px-5 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {safeUsers.map((u) => {
                  const guard = getUserDeleteGuard(u, currentAdminId);
                  const activity = formatUserActivity(u);
                  const noteId = `user-delete-note-${u.id}`;
                  const approvedText = formatApprovedAt(u.approved_at);
                  const hasPendingTeacher = Boolean(u.pending_teacher_application_id);
                  return (
                    <tr
                      key={u.id}
                      className={
                        hasPendingTeacher ? 'bg-accent-light/25 hover:bg-accent-light/40' : 'hover:bg-page/50'
                      }
                    >
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
                        <div className="flex flex-col items-start gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={u.role} />
                            {hasPendingTeacher && <StatusBadge status="pending" />}
                          </div>
                          {hasPendingTeacher && u.pending_teacher_expertise && (
                            <p className="text-xs text-muted">
                              Daftar Teacher: {u.pending_teacher_expertise}
                            </p>
                          )}
                          {hasPendingTeacher && u.pending_teacher_cv_url && (
                            <a
                              href={u.pending_teacher_cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary-dark hover:underline"
                            >
                              Lihat CV Pelamar (PDF)
                            </a>
                          )}
                          {!hasPendingTeacher && u.role === 'teacher' && approvedText && (
                            <p className="text-xs text-muted">Disetujui {approvedText}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm">
                        <p className="font-medium text-ink">{activity.primary}</p>
                        {activity.secondary && (
                          <p className="text-muted">{activity.secondary}</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === u.id}
                              onClick={() => openEditModal(u)}
                            >
                              <Pencil className="w-4 h-4" aria-hidden="true" />
                              <span>Edit</span>
                            </Button>
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

          <div className={`md:hidden space-y-3 transition-opacity ${loadingList ? 'opacity-65' : ''}`}>
            {safeUsers.map((u) => {
              const guard = getUserDeleteGuard(u, currentAdminId);
              const activity = formatUserActivity(u);
              const noteId = `mobile-user-delete-note-${u.id}`;
              const approvedText = formatApprovedAt(u.approved_at);
              const hasPendingTeacher = Boolean(u.pending_teacher_application_id);
              return (
                <div
                  key={u.id}
                  className={`rounded-3xl border p-5 space-y-3 ${
                    hasPendingTeacher ? 'bg-accent-light/25 border-accent-dark/35' : 'bg-white border-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={u.avatar_url} name={u.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{u.name}</p>
                        <p className="text-sm text-muted truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={u.role} />
                      {hasPendingTeacher && <StatusBadge status="pending" />}
                    </div>
                  </div>

                  {hasPendingTeacher && u.pending_teacher_expertise && (
                    <p className="text-xs font-medium text-ink">
                      Mendaftar sebagai Teacher: {u.pending_teacher_expertise}
                    </p>
                  )}
                  {hasPendingTeacher && u.pending_teacher_cv_url && (
                    <a
                      href={u.pending_teacher_cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-semibold text-primary-dark hover:underline"
                    >
                      Lihat CV Pelamar (PDF)
                    </a>
                  )}
                  {!hasPendingTeacher && u.role === 'teacher' && approvedText && (
                    <p className="text-xs text-muted">Disetujui {approvedText}</p>
                  )}

                  <div className="text-sm">
                    <span className="font-medium text-ink">{activity.primary}</span>
                    {activity.secondary && (
                      <span className="text-muted"> · {activity.secondary}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === u.id}
                      onClick={() => openEditModal(u)}
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      <span>Edit</span>
                    </Button>
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

          <nav
            aria-label="Navigasi halaman daftar pengguna"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
          >
            <p className="text-sm text-muted" aria-live="polite">
              Menampilkan <strong className="text-ink">{startItem}</strong>-
              <strong className="text-ink">{endItem}</strong> dari{' '}
              <strong className="text-ink">{safePagination.total}</strong> pengguna (Halaman{' '}
              {safePagination.page} dari {safePagination.totalPages})
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={safePagination.page <= 1 || loadingList}
                onClick={() => fetchUsersPage({ nextPage: safePagination.page - 1 })}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span>Sebelumnya</span>
              </Button>
              {Array.from({ length: safePagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  disabled={loadingList}
                  aria-current={pageNum === safePagination.page ? 'page' : undefined}
                  aria-label={`Halaman ${pageNum}`}
                  onClick={() => fetchUsersPage({ nextPage: pageNum })}
                  className={`min-h-11 min-w-11 px-3 rounded-full text-sm font-semibold border transition ${
                    pageNum === safePagination.page
                      ? 'bg-primary-hover text-white border-primary-hover'
                      : 'bg-white text-ink border-line hover:border-primary'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={safePagination.page >= safePagination.totalPages || loadingList}
                onClick={() => fetchUsersPage({ nextPage: safePagination.page + 1 })}
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </>
      )}

      {/* Create / Edit User Native Dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="user-form-dialog-title"
        onClose={() => setFormOpen(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-line bg-white p-6 sm:p-7 text-ink shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="user-form-dialog-title" className="font-heading text-xl font-bold text-ink">
              {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {editingUser
                ? 'Perbarui username, email, password, atau peran pengguna.'
                : 'Buat akun baru dan tentukan perannya di platform.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            aria-label="Tutup dialog formulir pengguna"
            className="min-h-11 min-w-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-muted hover:bg-page hover:text-ink transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSaveUser} className="space-y-4" noValidate>
          <InputField
            id="admin-user-name"
            name="name"
            label="Username"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            error={fieldErrors.name}
            hint="Disimpan pada kolom nama akun pengguna (2-100 karakter)."
            placeholder="Contoh: Budi Santoso"
          />

          <InputField
            id="admin-user-email"
            name="email"
            type="email"
            label="Email"
            required
            maxLength={150}
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            error={fieldErrors.email}
            placeholder="nama@domain.com"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="admin-user-password" className="block text-sm font-semibold text-ink">
                {editingUser ? 'Password Baru (Opsional)' : 'Password'}
                {!editingUser && <span className="text-danger-ink ml-1">*</span>}
              </label>
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="min-h-11 px-2.5 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-primary-dark hover:bg-primary-light/60 transition"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    <span>Tampilkan</span>
                  </>
                )}
              </button>
            </div>
            <input
              id="admin-user-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required={!editingUser}
              minLength={8}
              autoComplete="new-password"
              enterKeyHint="done"
              aria-invalid={fieldErrors.password ? 'true' : undefined}
              aria-describedby={
                fieldErrors.password ? 'admin-user-password-error' : 'admin-user-password-hint'
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              placeholder={editingUser ? 'Biarkan kosong jika tidak diganti' : 'Minimal 8 karakter'}
              className={`w-full min-h-12 rounded-2xl border bg-white px-4 text-base text-ink placeholder:text-muted/70 transition ${
                fieldErrors.password
                  ? 'border-danger focus:border-danger'
                  : 'border-line-strong focus:border-primary-hover'
              }`}
            />
            {fieldErrors.password ? (
              <p id="admin-user-password-error" className="text-sm text-danger-ink font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{fieldErrors.password}</span>
              </p>
            ) : (
              <p id="admin-user-password-hint" className="text-sm text-muted">
                {editingUser
                  ? 'Kosongkan jika tidak ingin mengubah kata sandi saat ini. Jika diisi, minimal 8 karakter.'
                  : 'Minimal 8 karakter.'}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">
              Peran (Role) <span className="text-danger-ink">*</span>
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((option) => {
                const disabledOption = Boolean(isEditingSelf && option.value !== 'admin');
                const checked = role === option.value;
                return (
                  <label
                    key={option.value}
                    htmlFor={`admin-user-role-${option.value}`}
                    className={`relative min-h-11 px-3 rounded-2xl border flex items-center justify-center text-sm font-semibold transition has-focus-visible:ring-2 has-focus-visible:ring-primary-hover has-focus-visible:ring-offset-2 ${
                      disabledOption
                        ? 'opacity-50 cursor-not-allowed bg-page border-line text-muted'
                        : checked
                        ? 'bg-primary-hover text-white border-primary-hover shadow-xs cursor-pointer'
                        : 'bg-white text-ink border-line-strong hover:border-primary cursor-pointer'
                    }`}
                  >
                    <input
                      id={`admin-user-role-${option.value}`}
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={checked}
                      disabled={disabledOption}
                      onChange={(e) => {
                        setRole(e.target.value);
                        clearFieldError('role');
                      }}
                      className="sr-only"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
            {isEditingSelf && (
              <p className="text-xs text-muted">
                Peran akun Admin yang sedang aktif tidak dapat diturunkan.
              </p>
            )}
            {fieldErrors.role && (
              <p className="text-sm text-danger-ink font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{fieldErrors.role}</span>
              </p>
            )}
          </fieldset>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={savingUser}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={savingUser}>
              {savingUser
                ? 'Menyimpan...'
                : editingUser
                ? 'Simpan Perubahan'
                : 'Buat Pengguna'}
            </Button>
          </div>
        </form>
      </dialog>

      {/* Delete Confirmation Modal */}
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
