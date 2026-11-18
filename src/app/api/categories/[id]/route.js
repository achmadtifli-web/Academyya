import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { deleteCategory, updateCategory } from '@/lib/queries/categories';
import { parsePositiveInt, validateCategoryPayload } from '@/lib/validators';

export async function PUT(request, context) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const categoryId = parsePositiveInt(id);
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'ID kategori tidak valid.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const validation = validateCategoryPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali data kategori.',
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const category = await updateCategory(categoryId, validation.data);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: { category }, message: 'Kategori berhasil diperbarui.' },
      { status: 200 }
    );
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui kategori.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const categoryId = parsePositiveInt(id);
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'ID kategori tidak valid.' }, { status: 400 });
    }

    const deleted = await deleteCategory(categoryId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: { deleted }, message: 'Kategori berhasil dihapus.' },
      { status: 200 }
    );
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus kategori.' },
      { status: 500 }
    );
  }
}
