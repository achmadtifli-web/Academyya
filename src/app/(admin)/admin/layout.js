import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAdminStats } from '@/lib/queries/users';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/admin');
  }
  if (user.role !== 'admin') {
    redirect('/403');
  }

  const stats = await getAdminStats();

  const adminNavItems = [
    { href: '/admin', label: 'Statistik Platform', icon: 'BarChart3' },
    {
      href: '/admin/teacher-requests',
      label: 'Verifikasi Teacher',
      icon: 'ShieldCheck',
      badgeCount: stats.pending_teacher_requests,
    },
    { href: '/admin/categories', label: 'Kelola Kategori', icon: 'FolderTree' },
    { href: '/admin/courses', label: 'Kelola Course', icon: 'BookOpen' },
    { href: '/admin/users', label: 'Kelola Pengguna', icon: 'Users' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar initialUser={user} />
      <DashboardShell roleLabel="Admin Panel" navItems={adminNavItems}>
        {children}
      </DashboardShell>
      <Footer />
    </div>
  );
}
