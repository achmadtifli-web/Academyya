import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE_NAME,
  getCurrentUser,
  getDefaultHomeForRole,
} from '@/lib/auth';

export { getDefaultHomeForRole };

export async function redirectIfUnauthenticated(callbackUrl = '') {
  const loginUrl = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/login';

  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (hasSessionCookie) {
    redirect(`/api/auth/clear-session?next=${encodeURIComponent(loginUrl)}`);
  }
  redirect(loginUrl);
}

export async function requirePageUser({ callbackUrl = '', roles = null } = {}) {
  const user = await getCurrentUser();
  if (!user) {
    await redirectIfUnauthenticated(callbackUrl);
  }
  if (roles && !roles.includes(user.role)) {
    redirect('/403');
  }
  return user;
}

export async function redirectAuthenticatedFromAuthPage(authPath = '/login') {
  const user = await getCurrentUser();
  if (user) {
    redirect(getDefaultHomeForRole(user.role));
  }

  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (hasSessionCookie) {
    redirect(`/api/auth/clear-session?next=${encodeURIComponent(authPath)}`);
  }
}
