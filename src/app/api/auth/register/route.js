import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { attachSessionCookie, hashPassword, signSessionToken } from '@/lib/auth';
import { createStudentUser, createTeacherApplicant } from '@/lib/queries/users';
import { validateRegisterPayload } from '@/lib/validators';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Permintaan tidak valid.' },
        { status: 400 }
      );
    }

    const validation = validateRegisterPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali data pendaftaran Anda.',
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, accountType, expertise, motivation, portfolio_url } =
      validation.data;

    const passwordHash = await hashPassword(password);

    const newUser =
      accountType === 'teacher'
        ? await createTeacherApplicant({
            name,
            email,
            passwordHash,
            expertise,
            motivation,
            portfolioUrl: portfolio_url,
          })
        : await createStudentUser({ name, email, passwordHash });

    const token = await signSessionToken({ sub: newUser.id, role: newUser.role });
    const message =
      accountType === 'teacher'
        ? 'Pendaftaran berhasil. Pengajuan Teacher Anda sedang menunggu verifikasi Admin.'
        : 'Akun Student berhasil dibuat. Selamat belajar di Academyya!';

    const response = NextResponse.json(
      {
        success: true,
        data: { user: newUser },
        message,
      },
      { status: 201 }
    );
    attachSessionCookie(response, token);
    return response;
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat mendaftar.' },
      { status: 500 }
    );
  }
}
