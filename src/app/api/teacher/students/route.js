import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { listTeacherStudents } from '@/lib/queries/enrollments';
import { parsePositiveInt } from '@/lib/validators';

export async function GET(request) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const rawCourseId = request.nextUrl.searchParams.get('courseId');
    const courseId = rawCourseId ? parsePositiveInt(rawCourseId) : null;
    const students = await listTeacherStudents(user.id, courseId);
    return NextResponse.json({ success: true, data: { students } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data progres siswa.' },
      { status: 500 }
    );
  }
}
