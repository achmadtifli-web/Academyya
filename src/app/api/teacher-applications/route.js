import { NextResponse } from 'next/server';
import { requireApiAuth, requireApiRole } from '@/lib/auth';
import { createTeacherApplication, getUserTeacherApplications } from '@/lib/queries/users';
import { parseTeacherRequestPayload } from '@/lib/teacherApplicationRequest';
import { deleteStoredTeacherCvByUrl, saveTeacherCvFile } from '@/lib/teacherCvStorage';
import { validateTeacherApplicationPayload } from '@/lib/validators';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const applications = await getUserTeacherApplications(user.id);
    return NextResponse.json({ success: true, data: { applications } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat riwayat pengajuan Teacher.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, errorResponse } = await requireApiRole(['student']);
  if (errorResponse) return errorResponse;

  let uploadedCvUrl = null;

  try {
    const parsed = await parseTeacherRequestPayload(request);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const validation = validateTeacherApplicationPayload(parsed.body);
    const fieldErrors = { ...validation.fieldErrors };

    if (!parsed.cvFile) {
      fieldErrors.cv = 'Unggah file CV dalam format PDF (wajib).';
    } else if (Object.keys(fieldErrors).length === 0) {
      const cvRes = await saveTeacherCvFile(parsed.cvFile, `user-${user.id}`);
      if (cvRes.error) {
        fieldErrors.cv = cvRes.error;
      } else {
        uploadedCvUrl = cvRes.cvUrl;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali formulir pengajuan Teacher.', fieldErrors },
        { status: 400 }
      );
    }

    const application = await createTeacherApplication({
      userId: user.id,
      expertise: validation.data.expertise,
      motivation: validation.data.motivation,
      portfolioUrl: validation.data.portfolio_url,
      cvUrl: uploadedCvUrl,
    });

    return NextResponse.json(
      {
        success: true,
        data: { application },
        message: 'Pengajuan Teacher berhasil dikirim dan menunggu peninjauan Admin.',
      },
      { status: 201 }
    );
  } catch (err) {
    if (uploadedCvUrl) {
      await deleteStoredTeacherCvByUrl(uploadedCvUrl);
    }
    if (err.code === 'REGISTRATION_ONLY') {
      return NextResponse.json(
        {
          success: false,
          error: 'Pengajuan Teacher hanya dapat dilakukan melalui halaman Daftar Teacher.',
        },
        { status: 403 }
      );
    }
    if (err.code === 'ALREADY_PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: 'Anda masih memiliki pengajuan Teacher yang sedang menunggu verifikasi.',
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim pengajuan Teacher.' },
      { status: 500 }
    );
  }
}
