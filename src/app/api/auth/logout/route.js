import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json(
    { success: true, data: null, message: 'Berhasil keluar dari akun.' },
    { status: 200 }
  );
  clearSessionCookie(response);
  return response;
}
