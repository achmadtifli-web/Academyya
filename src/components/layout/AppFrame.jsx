import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export function AppFrame({ user, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar initialUser={user} />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  );
}
