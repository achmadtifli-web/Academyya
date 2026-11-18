import { NextResponse } from 'next/server';
import { attachSessionCookie, signSessionToken, verifyPassword } from '@/lib/auth';
import { findUserByEmail } from '@/lib/queries/users';
import { isValidEmail, normalizeEmail } from '@/lib/validators';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || '');

    if (!isValidEmail(email) || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan kata sandi wajib diisi dengan format yang benar.' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau kata sandi salah.' },
        { status: 401 }
      );
    }

    const matches = await verifyPassword(password, user.password_hash);
    if (!matches) {
      return NextResponse.json(
        { success: false, error: 'Email atau kata sandi salah.' },
        { status: 401 }
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      bio: user.bio,
    };

    const token = await signSessionToken({ sub: safeUser.id, role: safeUser.role });
    const response = NextResponse.json(
      {
        success: true,
        data: { user: safeUser },
        message: 'Berhasil masuk ke Academyya.',
      },
      { status: 200 }
    );
    attachSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memproses login.' },
      { status: 500 }
    );
  }
}
