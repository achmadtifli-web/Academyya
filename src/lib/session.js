import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'academyya_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getDefaultHomeForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/dashboard';
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'academyya-fallback-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

/**
 * Sign an HS256 JWT containing the minimal session claims (user id and role).
 */
export async function signSessionToken(payload) {
  return new SignJWT({
    sub: String(payload.sub),
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

/**
 * Verify and decode the session JWT without hitting the database (safe for Edge middleware).
 */
export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;
    return {
      userId,
      role: typeof payload.role === 'string' ? payload.role : 'student',
    };
  } catch {
    return null;
  }
}
