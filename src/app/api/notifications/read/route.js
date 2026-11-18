import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { markNotificationsRead } from '@/lib/queries/notifications';
import { parsePositiveInt } from '@/lib/validators';

export async function PATCH(request) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const notificationId = body?.id ? parsePositiveInt(body.id) : null;

    await markNotificationsRead(user.id, notificationId);
    return NextResponse.json(
      { success: true, data: null, message: 'Notifikasi ditandai sudah dibaca.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status notifikasi.' },
      { status: 500 }
    );
  }
}
