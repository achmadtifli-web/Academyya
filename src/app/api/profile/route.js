import { NextResponse } from 'next/server';
import { hashPassword, requireApiAuth, verifyPassword } from '@/lib/auth';
import { deleteStoredAvatarByUrl, saveUserAvatarFile } from '@/lib/avatarStorage';
import { getUserPasswordHash, updateUserProfile } from '@/lib/queries/users';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;
  return NextResponse.json({ success: true, data: { user } }, { status: 200 });
}

export async function PUT(request) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  let uploadedAvatarUrl = null;

  try {
    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let bio = '';
    let currentPassword = '';
    let newPassword = '';
    let removeAvatar = false;
    let avatarFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json({ success: false, error: 'Data formulir tidak valid.' }, { status: 400 });
      }
      name = String(formData.get('name') || '').trim();
      bio = String(formData.get('bio') || '').trim();
      currentPassword = String(formData.get('currentPassword') || '');
      newPassword = String(formData.get('newPassword') || '');
      removeAvatar = formData.get('removeAvatar') === 'true';

      const rawAvatar = formData.get('avatar');
      if (rawAvatar && typeof rawAvatar === 'object' && typeof rawAvatar.arrayBuffer === 'function' && rawAvatar.size > 0) {
        avatarFile = rawAvatar;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ success: false, error: 'Data tidak valid.' }, { status: 400 });
      }
      name = String(body.name || '').trim();
      bio = String(body.bio || '').trim();
      currentPassword = String(body.currentPassword || '');
      newPassword = String(body.newPassword || '');
      removeAvatar = body.removeAvatar === true;
    }

    const fieldErrors = {};

    if (name.length < 2 || name.length > 100) {
      fieldErrors.name = 'Nama harus antara 2 sampai 100 karakter.';
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

    if (avatarFile && Object.keys(fieldErrors).length === 0) {
      const uploadRes = await saveUserAvatarFile(user.id, avatarFile);
      if (uploadRes.error) {
        fieldErrors.avatar = uploadRes.error;
      } else {
        uploadedAvatarUrl = uploadRes.avatarUrl;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali data profil Anda.', fieldErrors },
        { status: 400 }
      );
    }

    const nextAvatarUrl = uploadedAvatarUrl
      ? uploadedAvatarUrl
      : removeAvatar
      ? null
      : user.avatar_url || null;

    const updated = await updateUserProfile(user.id, {
      name,
      bio: bio || null,
      avatarUrl: nextAvatarUrl,
      passwordHash: nextPasswordHash,
    });

    if (user.avatar_url && user.avatar_url !== nextAvatarUrl) {
      await deleteStoredAvatarByUrl(user.avatar_url);
    }

    return NextResponse.json(
      { success: true, data: { user: updated }, message: 'Profil berhasil diperbarui.' },
      { status: 200 }
    );
  } catch {
    if (uploadedAvatarUrl) {
      await deleteStoredAvatarByUrl(uploadedAvatarUrl);
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui profil.' },
      { status: 500 }
    );
  }
}
