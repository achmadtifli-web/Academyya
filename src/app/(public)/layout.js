import { getCurrentUser } from '@/lib/auth';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen print:min-h-0 flex flex-col bg-page print:bg-white">
      <Navbar initialUser={user} />
      <div className="flex-1 flex flex-col min-w-0 w-full print:block">{children}</div>
      <Footer />
    </div>
  );
}
