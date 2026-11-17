'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  FolderTree,
  LayoutDashboard,
  ShieldCheck,
  User,
  Users,  
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  BookOpen,
  Users,
  User,
  BarChart3,
  ShieldCheck,
  FolderTree,
};

export function DashboardShell({ roleLabel, navItems = [], children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActivePath = (href) => {
    if (href === '/teacher' || href === '/admin') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
      {/* Mobile Workspace Nav Selector */}
      <div className="lg:hidden bg-white border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          className="w-full min-h-11 px-4 rounded-2xl border border-line bg-page flex items-center justify-between text-base font-semibold text-ink"
        >
          <span>Menu {roleLabel}</span>
          <ChevronDown
            className={`w-5 h-5 text-muted transition ${mobileMenuOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        {mobileMenuOpen && (
          <nav aria-label={`Navigasi ${roleLabel}`} className="mt-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.icon] || LayoutDashboard;
              const active = isActivePath(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`min-h-11 px-4 rounded-full flex items-center justify-between gap-3 text-base font-medium transition ${
                    active
                      ? 'bg-primary-hover text-white font-semibold'
                      : 'text-ink hover:bg-page'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {item.badgeCount > 0 && (
                    <span className="min-w-6 h-6 px-2 rounded-full bg-coral text-ink text-xs font-bold flex items-center justify-center">
                      {item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 bg-white border-r border-line p-5">
        <p className="px-4 text-sm font-semibold text-muted mb-3">{roleLabel}</p>
        <nav aria-label={`Navigasi ${roleLabel}`} className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const active = isActivePath(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-11 px-4 py-2.5 rounded-full flex items-center justify-between gap-3 text-base transition ${
                  active
                    ? 'bg-primary-hover text-white font-semibold shadow-xs'
                    : 'text-ink hover:bg-page font-medium'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badgeCount > 0 && (
                  <span className="min-w-6 h-6 px-2 rounded-full bg-coral text-ink text-xs font-bold flex items-center justify-center shrink-0">
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
