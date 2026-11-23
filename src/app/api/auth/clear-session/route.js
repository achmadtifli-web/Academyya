import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  getDefaultHomeForRole,
  verifySessionToken,
} from '@/lib/auth';
import { fetchFreshUserSessionProfile } from '@/lib/queries/users';

function getSafeRedirectPath(rawNext) {
  if (
    typeof rawNext === 'string' &&
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.startsWith('/api/auth/clear-session')
  ) {
    return rawNext;
  }
  return '/login';
}

export async function GET(request) {
  const safeNext = getSafeRedirectPath(request.nextUrl.searchParams.get('next'));
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    try {
      const existingUser = await fetchFreshUserSessionProfile(session.userId);
      if (existingUser) {
        return NextResponse.redirect(
          new URL(getDefaultHomeForRole(existingUser.role), request.url)
        );
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const response = NextResponse.redirect(new URL(safeNext, request.url));
  clearSessionCookie(response);
  return response;
}
