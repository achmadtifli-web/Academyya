import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { createTeacherCourse, listTeacherCourses } from '@/lib/queries/courses';
import { validateCoursePayload } from '@/lib/validators';

export async function GET() {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
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
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    const validation = validateCoursePayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali formulir course.',
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const course = await createTeacherCourse({
      teacherId: user.id,
      ...validation.data,
    });

    return NextResponse.json(
      { success: true, data: { course }, message: 'Course draft berhasil dibuat.' },
      { status: 201 }
    );
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal membuat course baru.' },
      { status: 500 }
    );
  }
}
