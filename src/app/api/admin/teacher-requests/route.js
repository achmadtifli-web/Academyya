import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { listTeacherApplicationsForAdmin } from '@/lib/queries/users';

export async function GET(request) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const status = request.nextUrl.searchParams.get('status') || 'all';
    const requests = await listTeacherApplicationsForAdmin(status);
    return NextResponse.json({ success: true, data: { requests } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar pengajuan Teacher.' },
      { status: 500 }
    );
  }
}
