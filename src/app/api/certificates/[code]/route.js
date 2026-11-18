import { NextResponse } from 'next/server';
import { getCertificateByCode } from '@/lib/queries/certificates';

export async function GET(_request, context) {
  try {
    const { code } = await context.params;
    const certificate = await getCertificateByCode(code);
    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Sertifikat tidak ditemukan atau belum valid.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: { certificate } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memverifikasi sertifikat.' },
      { status: 500 }
    );
  }
}
