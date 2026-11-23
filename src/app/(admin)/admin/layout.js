import { requirePageUser } from '@/lib/pageAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const user = await requirePageUser({
    callbackUrl: '/admin',
    roles: ['admin'],
  });

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar initialUser={user} />
      <DashboardShell>{children}</DashboardShell>
      <Footer />
    </div>
  );
}
