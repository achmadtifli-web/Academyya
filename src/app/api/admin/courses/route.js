import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { listCoursesForAdmin } from '@/lib/queries/courses';

export async function GET(request) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const q = request.nextUrl.searchParams.get('q');
    const status = request.nextUrl.searchParams.get('status');
    const courses = await listCoursesForAdmin({ q, status });
    return NextResponse.json({ success: true, data: { courses } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar course moderasi.' },
      { status: 500 }
    );
  }
}
