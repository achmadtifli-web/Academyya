import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { deleteCourseById, getCourseById, updateCourseDetails } from '@/lib/queries/courses';
import { parsePositiveInt, validateCoursePayload } from '@/lib/validators';

function canManageCourse(course, user) {
  return user.role === 'admin' || Number(course.teacher_id) === Number(user.id);
}

export async function GET(_request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
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
  if (!canManageCourse(course, user)) {
    return NextResponse.json(
      { success: false, error: 'Anda tidak memiliki izin mengakses course ini.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, data: { course } }, { status: 200 });
}

export async function PUT(request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
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
    if (!canManageCourse(existing, user)) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak berhak mengubah course milik pengajar lain.' },
        { status: 403 }
      );
    }

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

    let nextStatus = existing.status;
    if (body?.status === 'published' || body?.status === 'draft') {
      nextStatus = body.status;
    }
    if (nextStatus === 'published' && existing.total_materials < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tambahkan minimal 1 materi sebelum mempublikasikan course.',
        },
        { status: 400 }
      );
    }

    const updated = await updateCourseDetails(courseId, {
      ...validation.data,
      status: nextStatus,
    });

    return NextResponse.json(
      { success: true, data: { course: updated }, message: 'Perubahan course berhasil disimpan.' },
      { status: 200 }
    );
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui course.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
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
    if (!canManageCourse(existing, user)) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak berhak mengubah status course milik pengajar lain.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const nextStatus = body?.status;
    if (!['draft', 'published'].includes(nextStatus)) {
      return NextResponse.json(
        { success: false, error: 'Status course harus draft atau published.' },
        { status: 400 }
      );
    }

    if (nextStatus === 'published' && existing.total_materials < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course harus memiliki minimal 1 materi sebelum dapat dipublikasikan.',
        },
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
            ? 'Course berhasil dipublikasikan ke katalog.'
            : 'Course dikembalikan ke status draft.',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status course.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
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
    if (!canManageCourse(existing, user)) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak berhak menghapus course milik pengajar lain.' },
        { status: 403 }
      );
    }

    const deleted = await deleteCourseById(courseId);
    return NextResponse.json(
      { success: true, data: { deleted }, message: 'Course berhasil dihapus.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus course.' },
      { status: 500 }
    );
  }
}
