'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Award,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';

const PUBLIC_NAV_LINKS = [
  { href: '/', label: 'Beranda', Icon: Home },
  { href: '/courses', label: 'Katalog', Icon: BookOpen },
];

function getRoleWorkspace(role) {
  if (role === 'admin') {
    return { href: '/admin', label: 'Admin Panel', Icon: Shield };
  }
  if (role === 'teacher') {
    return { href: '/teacher', label: 'Teacher Panel', Icon: UserCheck };
  }
  return { href: '/dashboard', label: 'My Learning', Icon: LayoutDashboard };
}

export function Navbar({ initialUser = null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  // Key menu visibility to current pathname so route transitions auto-close drawers without useEffect setState.
  const [openPanel, setOpenPanel] = useState(null);
  const [unreadOverride, setUnreadOverride] = useState(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const user = loggedOut ? null : initialUser;
  const mobileOpen = openPanel === `mobile:${pathname}`;
  const notifOpen = openPanel === `notif:${pathname}`;
  const userMenuOpen = openPanel === `user:${pathname}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenPanel(null);
      }
    };
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenPanel((prev) => (prev?.startsWith('notif:') ? null : prev));
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenPanel((prev) => (prev?.startsWith('user:') ? null : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications || []);
      }
    } catch {
      // Ignore silent header polling failure.
    } finally {
      setNotifLoading(false);
    }
  };

  const toggleNotifications = () => {
    const nextOpen = !notifOpen;
    setOpenPanel(nextOpen ? `notif:${pathname}` : null);
    if (nextOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadOverride(0);
      }
    } catch {
      showToast({ type: 'error', message: 'Gagal menandai notifikasi.' });
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadOverride((prev) => {
          const base = prev !== null ? prev : user?.unread_notifications || 0;
          return Math.max(0, base - 1);
        });
      }
    } catch {
      // Ignore single read toggle failure.
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setLoggedOut(true);
      setOpenPanel(null);
      showToast({ type: 'success', message: 'Anda telah keluar dari akun.' });
      router.push('/login');
      router.refresh();
    } catch {
      showToast({ type: 'error', message: 'Gagal keluar dari akun.' });
    }
  };

  const workspace = user ? getRoleWorkspace(user.role) : null;
  const unreadCount = unreadOverride !== null ? unreadOverride : user?.unread_notifications || 0;

  return (
    <>
      <header className="no-print fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="min-h-11 flex items-center gap-2.5 shrink-0 rounded-full pr-2 py-1"
        >
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            priority
            className="w-11 h-11 object-contain shrink-0"
          />
          <span className="font-heading font-bold text-xl text-primary-dark tracking-tight">
            Academyya
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-4 lg:gap-6">
          {PUBLIC_NAV_LINKS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-11 inline-flex items-center px-2 text-base transition ${
                  isActive
                    ? 'text-primary-dark font-semibold'
                    : 'text-ink/85 hover:text-primary-hover font-medium'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {!user ? (
            <div className="flex items-center gap-2.5">
              <Button href="/login" variant="outline" size="sm">
                Masuk
              </Button>
              <Button href="/register" variant="primary" size="sm">
                Daftar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  aria-expanded={notifOpen}
                  aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
                  className="relative min-h-11 min-w-11 flex items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-page transition"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadCount > 0  && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-coral text-ink text-xs font-bold flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    role="region"
                    aria-label="Daftar notifikasi"
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-line bg-white shadow-xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                      <h3 className="font-heading font-semibold text-base text-ink">
                        Notifikasi
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="min-h-11 px-3 rounded-full text-sm font-semibold text-primary-dark hover:bg-primary-light inline-flex items-center gap-1.5"
                        >
                          <CheckCheck className="w-4 h-4" aria-hidden="true" />
                          <span>Tandai semua dibaca</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                      {notifLoading ? (
                        <p className="text-sm text-muted py-4 text-center">
                          Memuat notifikasi...
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className="text-sm text-muted py-4 text-center">
                          Belum ada notifikasi baru.
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => !notif.is_read && handleMarkSingleRead(notif.id)}
                            className={`w-full text-left rounded-2xl p-3 border transition ${
                              notif.is_read
                                ? 'bg-white border-line text-muted'
                                : 'bg-primary-light/60 border-primary/30 text-ink'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-ink">
                                {notif.title}
                              </span>
                              {!notif.is_read && (
                                <span className="w-2.5 h-2.5 rounded-full bg-primary-hover shrink-0" />
                              )}
                            </div>
                            {notif.message && (
                              <p className="mt-1 text-sm text-muted leading-snug">
                                {notif.message}
                              </p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {workspace && (
                <Button href={workspace.href} variant="outline" size="sm">
                  <workspace.Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{workspace.label}</span>
                </Button>
              )}

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenPanel(userMenuOpen ? null : `user:${pathname}`)
                  }
                  aria-expanded={userMenuOpen}
                  aria-label="Menu pengguna"
                  className="min-h-11 inline-flex items-center gap-2 rounded-full border border-line bg-white pl-2 pr-3 py-1 hover:bg-page transition"
                >
                  <Avatar src={user.avatar_url} name={user.name} size="sm" />
                  <span className="hidden xl:inline text-sm font-semibold text-ink max-w-28 truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted" aria-hidden="true" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-3xl border border-line bg-white shadow-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-line mb-1 flex items-center gap-2.5">
                      <Avatar src={user.avatar_url} name={user.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                        <p className="text-sm text-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setOpenPanel(null)}
                      className="min-h-11 px-3 rounded-2xl flex items-center gap-2.5 text-sm font-medium text-ink hover:bg-page"
                    >
                      <User className="w-4 h-4 text-muted" aria-hidden="true" />
                      <span>Profil Saya</span>
                    </Link>
                    {user.role === 'student' && (
                      <Link
                        href="/certificates"
                        onClick={() => setOpenPanel(null)}
                        className="min-h-11 px-3 rounded-2xl flex items-center gap-2.5 text-sm font-medium text-ink hover:bg-page"
                      >
                        <Award className="w-4 h-4 text-muted" aria-hidden="true" />
                        <span>Sertifikat Saya</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full min-h-11 px-3 rounded-2xl flex items-center gap-2.5 text-sm font-semibold text-danger-ink hover:bg-danger-light text-left"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenPanel(mobileOpen ? null : `mobile:${pathname}`)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="min-h-11 min-w-11 px-3 inline-flex items-center gap-2 rounded-full border border-line bg-white text-sm font-semibold text-ink hover:bg-page"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden border-t border-line bg-white px-4 py-4 space-y-3 max-h-[calc(100dvh-5rem)] overflow-y-auto"
        >
          <nav aria-label="Navigasi seluler" className="space-y-1">
            {PUBLIC_NAV_LINKS.map((item) => {
              const Icon = item.Icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenPanel(null)}
                  className={`min-h-12 px-4 rounded-2xl flex items-center gap-3 text-base transition ${
                    isActive
                      ? 'bg-primary-light/70 text-primary-dark font-semibold'
                      : 'text-ink font-medium hover:bg-page'
                  }`}
                >
                  <Icon className="w-4 h-4 text-primary-hover" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {!user ? (
            <div className="pt-2 grid grid-cols-2 gap-3">
              <Button href="/login" variant="outline" className="w-full">
                Masuk
              </Button>
              <Button href="/register" variant="primary" className="w-full">
                Daftar
              </Button>
            </div>
          ) : (
            <div className="pt-3 border-t border-line space-y-2">
              <div className="px-2 pb-1 flex items-center gap-3">
                <Avatar src={user.avatar_url} name={user.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
              </div>
              {workspace && (
                <Link
                  href={workspace.href}
                  onClick={() => setOpenPanel(null)}
                  className="min-h-12 px-4 rounded-2xl bg-primary-light text-primary-dark font-semibold flex items-center gap-3"
                >
                  <workspace.Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{workspace.label}</span>
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setOpenPanel(null)}
                className="min-h-12 px-4 rounded-2xl flex items-center gap-3 text-base font-medium text-ink hover:bg-page"
              >
                <User className="w-5 h-5 text-muted" aria-hidden="true" />
                <span>Profil Saya</span>
              </Link>
              {user.role === 'student' && (
                <Link
                  href="/certificates"
                  onClick={() => setOpenPanel(null)}
                  className="min-h-12 px-4 rounded-2xl flex items-center gap-3 text-base font-medium text-ink hover:bg-page"
                >
                  <Award className="w-5 h-5 text-muted" aria-hidden="true" />
                  <span>Sertifikat Saya</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full min-h-12 px-4 rounded-2xl flex items-center gap-3 text-base font-semibold text-danger-ink hover:bg-danger-light text-left"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      )}
      </header>
      <div className="no-print h-20 shrink-0" aria-hidden="true" />
    </>
  );
}
