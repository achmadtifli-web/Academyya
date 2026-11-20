import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { deleteUserByAdmin } from '@/lib/queries/users';
import { parsePositiveInt } from '@/lib/validators';

export async function DELETE(_request, context) {
  const { user, errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const targetId = parsePositiveInt(id);
    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'ID pengguna tidak valid.' },
        { status: 400 }
      );
    }

    if (Number(targetId) === Number(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri.' },
        { status: 400 }
      );
    }

    const deleted = await deleteUserByAdmin(targetId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { deleted }, message: 'Akun pengguna berhasil dihapus.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pengguna.' },
      { status: 500 }
    );
  }
}
