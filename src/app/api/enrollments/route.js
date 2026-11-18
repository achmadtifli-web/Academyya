import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { enrollStudentInCourse, listStudentEnrollments } from '@/lib/queries/enrollments';
import { parsePositiveInt } from '@/lib/validators';

export async function GET() {
  const { user, errorResponse } = await requireApiRole(['student']);
  if (errorResponse) return errorResponse;

  try {
    const enrollments = await listStudentEnrollments(user.id);
    return NextResponse.json({ success: true, data: { enrollments } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar belajar Anda.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, errorResponse } = await requireApiRole(['student']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    const courseId = parsePositiveInt(body?.course_id);
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'ID course tidak valid.' },
        { status: 400 }
      );
    }

    const result = await enrollStudentInCourse(user.id, courseId);
    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Berhasil mendaftar ke course. Selamat belajar!',
      },
      { status: 201 }
    );
  } catch (err) {
    if (err.code === 'COURSE_NOT_AVAILABLE') {
      return NextResponse.json(
        { success: false, error: 'Course tidak tersedia atau belum dipublikasikan.' },
        { status: 404 }
      );
    }
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal mendaftar ke course.' },
      { status: 500 }
    );
  }
}
