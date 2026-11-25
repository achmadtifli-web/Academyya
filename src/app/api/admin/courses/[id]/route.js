import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { handleCoursePatchAction, handleUpdateCourseMutation } from '@/lib/courseMutations';
import { deleteStoredCourseThumbnailByUrl } from '@/lib/courseThumbnailStorage';
import { deleteCourseById, getCourseById } from '@/lib/queries/courses';
import { parsePositiveInt } from '@/lib/validators';

export async function GET(_request, context) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const courseId = parsePositiveInt(id);
  if (!courseId) {
    return NextResponse.json({ success: false, error: 'ID course tidak valid.' }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ success: false, error: 'Course tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { course } }, { status: 200 });
}

export async function PUT(request, context) {
  const { user, errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const courseId = parsePositiveInt(id);
  if (!courseId) {
    return NextResponse.json({ success: false, error: 'ID course tidak valid.' }, { status: 400 });
  }

  const existing = await getCourseById(courseId);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Course tidak ditemukan.' }, { status: 404 });
  }

  return handleUpdateCourseMutation(request, user, existing, { allowSelectTeacher: true });
}

export async function PATCH(request, context) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const courseId = parsePositiveInt(id);
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'ID course tidak valid.' }, { status: 400 });
    }

    const existing = await getCourseById(courseId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    return await handleCoursePatchAction(courseId, existing, body);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memoderasi status course.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const courseId = parsePositiveInt(id);
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'ID course tidak valid.' }, { status: 400 });
    }

    const result = await deleteCourseById(courseId);
    if (result.status === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Course tidak ditemukan.' }, { status: 404 });
    }
    if (result.status === 'BLOCKED') {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    if (result.course.thumbnail_url) {
      await deleteStoredCourseThumbnailByUrl(result.course.thumbnail_url);
    }

    return NextResponse.json(
      { success: true, data: { deleted: result.course }, message: 'Course berhasil dihapus oleh Admin.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus course.' },
      { status: 500 }
    );
  }
}
