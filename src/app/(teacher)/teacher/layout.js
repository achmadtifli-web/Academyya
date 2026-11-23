import { redirect } from 'next/navigation';
import { requirePageUser } from '@/lib/pageAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

export default async function TeacherLayout({ children }) {
  const user = await requirePageUser({ callbackUrl: '/teacher' });
  if (user.role === 'admin') {
    redirect('/admin');
  }
  if (user.role !== 'teacher') {
    redirect('/403');
  }

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar initialUser={user} />
      <DashboardShell>{children}</DashboardShell>
      <Footer />
    </div>
  );
}
