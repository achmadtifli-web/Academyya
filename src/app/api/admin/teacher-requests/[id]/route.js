import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { reviewTeacherApplication } from '@/lib/queries/users';
import { parsePositiveInt } from '@/lib/validators';

export async function PATCH(request, context) {
  const { user, errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const applicationId = parsePositiveInt(id);
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan tidak valid.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;
    const reviewNote = String(body?.review_note || '').trim();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Aksi harus berupa approve atau reject.' },
        { status: 400 }
      );
    }

    if (action === 'reject' && reviewNote.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alasan penolakan minimal 5 karakter agar pelamar dapat memperbaikinya.',
          fieldErrors: { review_note: 'Masukkan alasan penolakan minimal 5 karakter.' },
        },
        { status: 400 }
      );
    }

    const updated = await reviewTeacherApplication({
      applicationId,
      adminId: user.id,
      action,
      reviewNote: reviewNote || null,
    });

    return NextResponse.json(
      {
        success: true,
        data: { application: updated },
        message:
          action === 'approve'
            ? 'Pengajuan Teacher berhasil disetujui.'
            : 'Pengajuan Teacher berhasil ditolak.',
      },
      { status: 200 }
    );
  } catch (err) {
    if (err.code === 'APPLICATION_NOT_PENDING') {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan atau sudah diproses sebelumnya.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memproses verifikasi pengajuan Teacher.' },
      { status: 500 }
    );
  }
}
