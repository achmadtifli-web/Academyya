import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { attachSessionCookie, hashPassword, signSessionToken } from '@/lib/auth';
import { createStudentUser, createTeacherApplicant } from '@/lib/queries/users';
import { parseTeacherRequestPayload } from '@/lib/teacherApplicationRequest';
import { deleteStoredTeacherCvByUrl, saveTeacherCvFile } from '@/lib/teacherCvStorage';
import { validateRegisterPayload } from '@/lib/validators';

export async function POST(request) {
  let uploadedCvUrl = null;

  try {
    const parsed = await parseTeacherRequestPayload(request);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const validation = validateRegisterPayload(parsed.body);
    const fieldErrors = { ...validation.fieldErrors };
    const { name, email, password, accountType, expertise, motivation, portfolio_url } =
      validation.data;

    if (accountType === 'teacher') {
      if (!parsed.cvFile) {
        fieldErrors.cv = 'Unggah file CV dalam format PDF (wajib).';
      } else if (Object.keys(fieldErrors).length === 0) {
        const cvRes = await saveTeacherCvFile(parsed.cvFile, 'reg');
        if (cvRes.error) {
          fieldErrors.cv = cvRes.error;
        } else {
          uploadedCvUrl = cvRes.cvUrl;
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali data pendaftaran Anda.',
          fieldErrors,
        },
        { status: 400 }
      );
    }

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
            cvUrl: uploadedCvUrl,
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
    if (uploadedCvUrl) {
      await deleteStoredTeacherCvByUrl(uploadedCvUrl);
    }
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
