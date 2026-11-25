import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { toggleMaterialProgress } from '@/lib/queries/enrollments';
import { parsePositiveInt } from '@/lib/validators';

export async function POST(request) {
  const { user, errorResponse } = await requireApiRole(['student']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    const courseId = parsePositiveInt(body?.course_id);
    const materialId = parsePositiveInt(body?.material_id);

    if (!courseId || !materialId) {
      return NextResponse.json(
        { success: false, error: 'Parameter course_id dan material_id tidak valid.' },
        { status: 400 }
      );
    }

    const result = await toggleMaterialProgress({
      studentId: user.id,
      courseId,
      materialId,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: result.course_completed
          ? result.certificate_code
            ? 'Selamat! Semua materi selesai dan sertifikat digital Anda telah terbit.'
            : 'Selamat! Semua materi selesai. Sertifikat akan terbit setelah course difinalisasi pengajar.'
          : result.is_completed
          ? 'Materi ditandai selesai.'
          : 'Status selesai materi dibatalkan.',
      },
      { status: 200 }
    );
  } catch (err) {
    if (err.code === 'NOT_ENROLLED') {
      return NextResponse.json(
        { success: false, error: 'Anda belum terdaftar pada course ini.' },
        { status: 403 }
      );
    }
    if (err.code === 'MATERIAL_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Materi tidak ditemukan dalam course ini.' },
        { status: 404 }
      );
    }
    if (err.code === 'ALREADY_COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Materi yang sudah ditandai selesai tidak dapat dibatalkan.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui progres belajar.' },
      { status: 500 }
    );
  }
}
