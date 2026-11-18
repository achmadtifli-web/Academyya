import { NextResponse } from 'next/server';
import { requireApiAuth, requireApiRole } from '@/lib/auth';
import { createTeacherApplication, getUserTeacherApplications } from '@/lib/queries/users';
import { isValidHttpUrl } from '@/lib/validators';

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

  try {
    const body = await request.json().catch(() => null);
    const expertise = String(body?.expertise || '').trim();
    const motivation = String(body?.motivation || '').trim();
    const portfolioUrl = String(body?.portfolio_url || '').trim();
    const fieldErrors = {};

    if (expertise.length < 3 || expertise.length > 150) {
      fieldErrors.expertise = 'Bidang keahlian minimal 3 karakter.';
    }
    if (motivation.length < 10) {
      fieldErrors.motivation = 'Motivasi mengajar minimal 10 karakter.';
    }
    if (portfolioUrl && !isValidHttpUrl(portfolioUrl)) {
      fieldErrors.portfolio_url = 'URL portofolio harus diawali http:// atau https://.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Periksa kembali formulir pengajuan Teacher.', fieldErrors },
        { status: 400 }
      );
    }

    const application = await createTeacherApplication({
      userId: user.id,
      expertise,
      motivation,
      portfolioUrl: portfolioUrl || null,
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
