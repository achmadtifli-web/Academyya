import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

const TEACHER_NAV_ITEMS = [
  { href: '/teacher', label: 'Ringkasan', icon: 'LayoutDashboard' },
  { href: '/teacher/courses', label: 'Kelola Course', icon: 'BookOpen' },
  { href: '/teacher/students', label: 'Progres Siswa', icon: 'Users' },
  { href: '/profile', label: 'Profil Saya', icon: 'User' },
];

export default async function TeacherLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/teacher');
  }
  if (user.role !== 'teacher' && user.role !== 'admin') {
    redirect('/403');
  }

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar initialUser={user} />
      <DashboardShell roleLabel="Teacher Panel" navItems={TEACHER_NAV_ITEMS}>
        {children}
      </DashboardShell>
      <Footer />
    </div>
  );
}
