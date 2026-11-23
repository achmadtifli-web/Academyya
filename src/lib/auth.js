import { cache } from 'react';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from '@/lib/session';
import { fetchFreshUserSessionProfile } from '@/lib/queries/users';

export { SESSION_COOKIE_NAME, signSessionToken, verifySessionToken };

export function getDefaultHomeForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/dashboard';
}

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

export function attachSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Resolve current authenticated user directly from PostgreSQL so role updates
 * (e.g., Teacher approval) take effect immediately without stale JWT claims.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  try {
    const user = await fetchFreshUserSessionProfile(session.userId);
    return user || null;
  } catch {
    return null;
  }
});

export async function requireApiAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Silakan masuk terlebih dahulu untuk melanjutkan.' },
        { status: 401 }
      ),
    };
  }
  return { user, errorResponse: null };
}

export async function requireApiRole(allowedRoles) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return { user: null, errorResponse };

  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Anda tidak memiliki izin untuk mengakses fitur ini.' },
        { status: 403 }
      ),
    };
  }
  return { user, errorResponse: null };
}
