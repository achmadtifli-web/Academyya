import { NextResponse } from 'next/server';
import { hashPassword, requireApiAuth, verifyPassword } from '@/lib/auth';
import { getUserPasswordHash, updateUserProfile } from '@/lib/queries/users';
import { isValidHttpUrl } from '@/lib/validators';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;
  return NextResponse.json({ success: true, data: { user } }, { status: 200 });
}

export async function PUT(request) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Data tidak valid.' }, { status: 400 });
    }

    const name = String(body.name || '').trim();
    const bio = String(body.bio || '').trim();
    const avatarUrl = String(body.avatar_url || '').trim();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    const fieldErrors = {};

    if (name.length < 2 || name.length > 100) {
      fieldErrors.name = 'Nama harus antara 2 sampai 100 karakter.';
    }
    if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
      fieldErrors.avatar_url = 'URL avatar harus diawali http:// atau https://.';
    }

    let nextPasswordHash = null;
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        fieldErrors.currentPassword = 'Masukkan kata sandi saat ini untuk mengganti kata sandi.';
      }
      if (newPassword.length < 8) {
        fieldErrors.newPassword = 'Kata sandi baru minimal 8 karakter.';
      }
      if (!fieldErrors.currentPassword && !fieldErrors.newPassword) {
        const storedHash = await getUserPasswordHash(user.id);
        const matches = await verifyPassword(currentPassword, storedHash || '');
        if (!matches) {
          fieldErrors.currentPassword = 'Kata sandi saat ini tidak sesuai.';
        } else {
          nextPasswordHash = await hashPassword(newPassword);
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali data profil Anda.', fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateUserProfile(user.id, {
      name,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
      passwordHash: nextPasswordHash,
    });

    return NextResponse.json(
      { success: true, data: { user: updated }, message: 'Profil berhasil diperbarui.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui profil.' },
      { status: 500 }
    );
  }
}
