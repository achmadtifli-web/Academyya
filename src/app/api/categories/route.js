import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { createCategory, listCategoriesWithCounts } from '@/lib/queries/categories';
import { validateCategoryPayload } from '@/lib/validators';

export async function GET() {
  try {
    const categories = await listCategoriesWithCounts();
    return NextResponse.json({ success: true, data: { categories } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar kategori.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
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

    const category = await createCategory(validation.data);
    return NextResponse.json(
      { success: true, data: { category }, message: 'Kategori berhasil ditambahkan.' },
      { status: 201 }
    );
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan kategori.' },
      { status: 500 }
    );
  }
}
