import { NextResponse } from 'next/server';
import { hashPassword, requireApiRole } from '@/lib/auth';
import { mapPgError } from '@/lib/db';
import { createUserByAdmin, listAdminUsers } from '@/lib/queries/users';
import { validateAdminUserPayload } from '@/lib/validators';

export async function GET(request) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || null;
    const role = searchParams.get('role') || null;
    const filter = searchParams.get('filter') || null;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '5';
    const result = await listAdminUsers({ q, role, filter, page, limit });
    return NextResponse.json(
      {
        success: true,
        data: {
          users: Array.isArray(result?.users)
            ? result.users
            : Array.isArray(result)
            ? result
            : [],
          pagination: result?.pagination || {
            page: Number(page) || 1,
            limit: Number(limit) || 5,
            total: Array.isArray(result) ? result.length : 0,
            totalPages: 1,
          },
          pendingTeacherCount: Number(result?.pendingTeacherCount || 0),
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar pengguna.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Permintaan tidak valid.' },
        { status: 400 }
      );
    }

    const validation = validateAdminUserPayload(body, { isEditing: false });
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali data pengguna.',
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validation.data;
    const passwordHash = await hashPassword(password);
    const createdUser = await createUserByAdmin({
      name,
      email,
      passwordHash,
      role: String(role),
    });

    return NextResponse.json(
      {
        success: true,
        data: { user: createdUser },
        message: 'Akun pengguna berhasil dibuat.',
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === '23505' && err?.constraint?.includes('email')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email sudah digunakan oleh pengguna lain.',
          fieldErrors: { email: 'Email sudah terdaftar di sistem.' },
        },
        { status: 409 }
      );
    }
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal membuat akun pengguna.' },
      { status: 500 }
    );
  }
}
