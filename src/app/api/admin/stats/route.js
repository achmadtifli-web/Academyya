import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { getAdminStats } from '@/lib/queries/users';

export async function GET() {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const stats = await getAdminStats();
    return NextResponse.json({ success: true, data: { stats } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat statistik platform.' },
      { status: 500 }
    );
  }
}
