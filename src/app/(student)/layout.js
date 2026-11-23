import { requirePageUser } from '@/lib/pageAuth';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({ children }) {
  await requirePageUser();
  return children;
}
