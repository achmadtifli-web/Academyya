import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { listUserNotifications } from '@/lib/queries/notifications';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const notifications = await listUserNotifications(user.id);
    return NextResponse.json({ success: true, data: { notifications } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat notifikasi.' },
      { status: 500 }
    );
  }
}
