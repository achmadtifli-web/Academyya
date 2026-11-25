import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { handleCreateCourseMutation } from '@/lib/courseMutations';
import { listTeacherCourses } from '@/lib/queries/courses';

export async function GET() {
  const { user, errorResponse } = await requireApiRole(['teacher']);
  if (errorResponse) return errorResponse;

  try {
    const courses = await listTeacherCourses(user.id);
    return NextResponse.json({ success: true, data: { courses } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar course Anda.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, errorResponse } = await requireApiRole(['teacher']);
  if (errorResponse) return errorResponse;

  return handleCreateCourseMutation(request, user, { allowSelectTeacher: false });
}
