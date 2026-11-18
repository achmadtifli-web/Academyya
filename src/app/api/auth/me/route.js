import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  attachSessionCookie,
  requireApiAuth,
  signSessionToken,
  verifySessionToken,
} from '@/lib/auth';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  const response = NextResponse.json({ success: true, data: { user } }, { status: 200 });

  // Refresh JWT cookie if database role changed (e.g., Teacher request approved by Admin).
  const cookieStore = await cookies();
  const currentSession = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (currentSession && currentSession.role !== user.role) {
    const refreshedToken = await signSessionToken({ sub: user.id, role: user.role });
    attachSessionCookie(response, refreshedToken);
  }

  return response;
}
