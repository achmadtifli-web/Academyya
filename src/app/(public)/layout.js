import { getCurrentUser } from '@/lib/auth';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar initialUser={user} />
      <div className="flex-1 flex flex-col min-w-0 w-full">{children}</div>
      <Footer />
    </div>
  );
}
