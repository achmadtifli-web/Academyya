import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { listAdminUsers } from '@/lib/queries/users';

export async function GET(request) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const q = request.nextUrl.searchParams.get('q');
    const role = request.nextUrl.searchParams.get('role');
    const users = await listAdminUsers({ q, role });
    return NextResponse.json({ success: true, data: { users } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar pengguna.' },
      { status: 500 }
    );
  }
}
