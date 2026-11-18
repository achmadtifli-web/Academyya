import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import {
  deleteMaterialAndCompact,
  getMaterialWithCourse,
  updateMaterialById,
} from '@/lib/queries/materials';
import { parsePositiveInt, validateMaterialPayload } from '@/lib/validators';

export async function PUT(request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const materialId = parsePositiveInt(id);
    if (!materialId) {
      return NextResponse.json({ success: false, error: 'ID materi tidak valid.' }, { status: 400 });
    }

    const existing = await getMaterialWithCourse(materialId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    if (user.role !== 'admin' && Number(existing.teacher_id) !== Number(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak berhak mengubah materi ini.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = validateMaterialPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali formulir materi.',
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await updateMaterialById(materialId, validation.data);
    return NextResponse.json(
      { success: true, data: { material: updated }, message: 'Materi berhasil diperbarui.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui materi.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const materialId = parsePositiveInt(id);
    if (!materialId) {
      return NextResponse.json({ success: false, error: 'ID materi tidak valid.' }, { status: 400 });
    }

    const existing = await getMaterialWithCourse(materialId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Materi tidak ditemukan.' }, { status: 404 });
    }
    if (user.role !== 'admin' && Number(existing.teacher_id) !== Number(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak berhak menghapus materi ini.' },
        { status: 403 }
      );
    }

    await deleteMaterialAndCompact(materialId, existing.course_id);
    return NextResponse.json(
      { success: true, data: { deletedId: materialId }, message: 'Materi berhasil dihapus.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus materi.' },
      { status: 500 }
    );
  }
}
