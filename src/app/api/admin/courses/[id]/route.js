import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { deleteStoredCourseThumbnailByUrl } from '@/lib/courseThumbnailStorage';
import { deleteCourseById, getCourseById, updateCourseDetails } from '@/lib/queries/courses';
import { parsePositiveInt } from '@/lib/validators';

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
    const nextStatus = body?.status;
    if (!['draft', 'published'].includes(nextStatus)) {
      return NextResponse.json(
        { success: false, error: 'Status moderasi harus draft atau published.' },
        { status: 400 }
      );
    }

    if (nextStatus === 'published' && existing.total_materials < 1) {
      return NextResponse.json(
        { success: false, error: 'Course belum memiliki materi untuk dipublikasikan.' },
        { status: 400 }
      );
    }

    const updated = await updateCourseDetails(courseId, { status: nextStatus });
    return NextResponse.json(
      {
        success: true,
        data: { course: updated },
        message:
          nextStatus === 'published'
            ? 'Course diaktifkan kembali di katalog.'
            : 'Course diturunkan ke status draft.',
      },
      { status: 200 }
    );
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
