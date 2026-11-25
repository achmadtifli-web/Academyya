'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { getDefaultHomeForRole } from '@/lib/session';

const GUEST_NAV_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/courses', label: 'Katalog' },
];

const STUDENT_NAV_LINKS = [
  { href: '/dashboard', label: 'My Learning' },
  { href: '/courses', label: 'Jelajahi Katalog' },
  { href: '/certificates', label: 'Sertifikat Saya' },
];

const TEACHER_NAV_LINKS = [
  { href: '/teacher', label: 'Ringkasan' },
  { href: '/teacher/courses', label: 'Kelola Course' },
  { href: '/teacher/students', label: 'Progres Siswa' },
];

const ADMIN_MANAGE_LINKS = [
  { href: '/admin/categories', label: 'Kategori' },
  { href: '/admin/courses', label: 'Course' },
  { href: '/admin/users', label: 'Pengguna' },
];

function getNavLinksForUser(user) {
  if (!user) return GUEST_NAV_LINKS;
  if (user.role === 'admin') {
    return [
      { href: '/admin', label: 'Ringkasan' },
      {
        href: '/admin/teacher-requests',
        label: 'Verifikasi Teacher',
        badgeCount: user.pending_teacher_requests || 0,
      },
      {
        id: 'manage',
        label: 'Kelola',
        children: ADMIN_MANAGE_LINKS,
      },
    ];
  }
  if (user.role === 'teacher') {
    return TEACHER_NAV_LINKS;
  }
  return STUDENT_NAV_LINKS;
}

function getBrandHref(user) {
  if (!user) return '/';
  return getDefaultHomeForRole(user.role);
}

function isNavLinkActive(pathname, href) {
  if (href === '/' || href === '/teacher' || href === '/admin') {
    return pathname === href;
  }
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/learn/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavTextClasses(isActive, inactiveTone = 'text-ink/85') {
  return isActive
    ? 'text-primary-dark font-semibold'
    : `${inactiveTone} hover:text-primary-hover active:text-primary-dark font-medium`;
}

function NavLabel({ label, isActive, underlineOffset = 'underline-offset-[6px]' }) {
  return (
    <span
      className={
        isActive
          ? `underline decoration-2 decoration-primary-hover ${underlineOffset}`
          : ''
      }
    >
      {label}
    </span>
  );
}

function PendingBadge({ count, mobile = false }) {
  if (!count) return null;
  return (
    <span
      className={`${
        mobile ? 'min-w-6 h-6 px-2' : 'min-w-5 h-5 px-1.5'
      } rounded-full bg-coral text-ink text-xs font-bold flex items-center justify-center shrink-0`}
    >
      {count}
      <span className="sr-only"> pengajuan menunggu</span>
    </span>
  );
}

export function Navbar({ initialUser = null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  // Key menu visibility to current pathname so route transitions auto-close drawers without useEffect setState.
  const [openPanel, setOpenPanel] = useState(null);
  const [mobileSubmenuState, setMobileSubmenuState] = useState({
    pathname: '',
    open: false,
  });
  const [unreadOverride, setUnreadOverride] = useState(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navGroupRef = useRef(null);
  const navGroupTriggerRef = useRef(null);

  const user = loggedOut ? null : initialUser;
  const mobileOpen = openPanel === `mobile:${pathname}`;
  const notifOpen = openPanel === `notif:${pathname}`;
  const userMenuOpen = openPanel === `user:${pathname}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (
          navGroupRef.current &&
          navGroupRef.current.contains(document.activeElement)
        ) {
          navGroupTriggerRef.current?.focus();
        }
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
      if (navGroupRef.current && !navGroupRef.current.contains(e.target)) {
        setOpenPanel((prev) => (prev?.startsWith('nav-') ? null : prev));
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

  const navLinks = getNavLinksForUser(user);
  const brandHref = getBrandHref(user);
  const unreadCount = unreadOverride !== null ? unreadOverride : user?.unread_notifications || 0;

  return (
    <>
      <header className="no-print fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link
            href={brandHref}
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

          <nav aria-label="Utama" className="hidden lg:block min-w-0">
            <ul className="flex items-center gap-5 xl:gap-7">
              {navLinks.map((item) => {
                if (item.children) {
                  const navGroupKey = `nav-${item.id}:${pathname}`;
                  const isGroupOpen = openPanel === navGroupKey;
                  const isGroupActive = item.children.some((child) =>
                    isNavLinkActive(pathname, child.href)
                  );
                  return (
                    <li
                      key={item.id}
                      ref={navGroupRef}
                      className="relative"
                      onBlur={(e) => {
                        if (
                          e.relatedTarget &&
                          !e.currentTarget.contains(e.relatedTarget)
                        ) {
                          setOpenPanel((prev) =>
                            prev === navGroupKey ? null : prev
                          );
                        }
                      }}
                    >
                      <button
                        ref={navGroupTriggerRef}
                        type="button"
                        aria-expanded={isGroupOpen}
                        aria-controls={`desktop-submenu-${item.id}`}
                        onClick={() =>
                          setOpenPanel(isGroupOpen ? null : navGroupKey)
                        }
                        className={`min-h-11 inline-flex items-center gap-1.5 px-1 text-sm xl:text-base whitespace-nowrap transition-colors ${getNavTextClasses(
                          isGroupActive
                        )}`}
                      >
                        <NavLabel label={item.label} isActive={isGroupActive} />
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isGroupOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      <ul
                        id={`desktop-submenu-${item.id}`}
                        hidden={!isGroupOpen}
                        className="absolute left-0 mt-2 w-48 rounded-3xl border border-line bg-white shadow-xl p-2 z-50 space-y-1"
                      >
                        {item.children.map((child) => {
                          const childActive = isNavLinkActive(pathname, child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                aria-current={childActive ? 'page' : undefined}
                                onClick={() => setOpenPanel(null)}
                                className={`min-h-11 px-3 flex items-center text-sm transition-colors ${getNavTextClasses(
                                  childActive,
                                  'text-ink'
                                )}`}
                              >
                                <NavLabel
                                  label={child.label}
                                  isActive={childActive}
                                  underlineOffset="underline-offset-4"
                                />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                }

                const isActive = isNavLinkActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`min-h-11 inline-flex items-center gap-2 px-1 text-sm xl:text-base whitespace-nowrap transition-colors ${getNavTextClasses(
                        isActive
                      )}`}
                    >
                      <NavLabel label={item.label} isActive={isActive} />
                      <PendingBadge count={item.badgeCount} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
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
                    {unreadCount > 0 && (
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
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
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
            <nav aria-label="Seluler">
              <ul className="space-y-1">
                {navLinks.map((item) => {
                  if (item.children) {
                    const isGroupActive = item.children.some((child) =>
                      isNavLinkActive(pathname, child.href)
                    );
                    const isMobileGroupOpen =
                      mobileSubmenuState.pathname === pathname
                        ? mobileSubmenuState.open
                        : isGroupActive;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-expanded={isMobileGroupOpen}
                          aria-controls={`mobile-submenu-${item.id}`}
                          onClick={() =>
                            setMobileSubmenuState({
                              pathname,
                              open: !isMobileGroupOpen,
                            })
                          }
                          className={`min-h-12 w-full px-2 flex items-center justify-between gap-3 text-base transition-colors text-left ${getNavTextClasses(
                            isGroupActive,
                            'text-ink'
                          )}`}
                        >
                          <NavLabel label={item.label} isActive={isGroupActive} />
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isMobileGroupOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                        <ul
                          id={`mobile-submenu-${item.id}`}
                          hidden={!isMobileGroupOpen}
                          className="ml-2 pl-4 border-l border-line space-y-1 mt-1"
                        >
                          {item.children.map((child) => {
                            const childActive = isNavLinkActive(pathname, child.href);
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  aria-current={childActive ? 'page' : undefined}
                                  onClick={() => setOpenPanel(null)}
                                  className={`min-h-11 px-2 flex items-center text-base transition-colors ${getNavTextClasses(
                                    childActive
                                  )}`}
                                >
                                  <NavLabel
                                    label={child.label}
                                    isActive={childActive}
                                    underlineOffset="underline-offset-4"
                                  />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  }

                  const isActive = isNavLinkActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setOpenPanel(null)}
                        className={`min-h-12 px-2 flex items-center justify-between gap-3 text-base transition-colors ${getNavTextClasses(
                          isActive,
                          'text-ink'
                        )}`}
                      >
                        <NavLabel label={item.label} isActive={isActive} />
                        <PendingBadge count={item.badgeCount} mobile />
                      </Link>
                    </li>
                  );
                })}
              </ul>
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
                <Link
                  href="/profile"
                  onClick={() => setOpenPanel(null)}
                  className="min-h-12 px-2 flex items-center gap-3 text-base font-medium text-ink hover:text-primary-hover active:text-primary-dark transition-colors"
                >
                  <User className="w-5 h-5 text-muted" aria-hidden="true" />
                  <span>Profil Saya</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-12 px-2 flex items-center gap-3 text-base font-semibold text-danger-ink hover:text-danger transition-colors text-left"
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
