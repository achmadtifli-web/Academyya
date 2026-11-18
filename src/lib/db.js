import { Pool } from 'pg';

const globalForPg = globalThis;

const pool =
  globalForPg.__academyyaPgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.__academyyaPgPool = pool;
}

/**
 * Execute a parameterized SQL query against the shared connection pool.
 */
export async function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Acquire a dedicated client for explicit BEGIN/COMMIT/ROLLBACK transactions.
 */
export async function getClient() {
  return pool.connect();
}

/**
 * Map PostgreSQL SQLSTATE errors to Indonesian user-facing HTTP responses.
 */
export function mapPgError(err) {
  if (!err || !err.code) return null;

  switch (err.code) {
    case '23505':
      if (err.constraint?.includes('email')) {
        return {
          status: 409,
          error: 'Email sudah terdaftar. Gunakan email lain atau silakan masuk.',
        };
      }
      if (err.constraint?.includes('enrollments')) {
        return {
          status: 409,
          error: 'Kamu sudah terdaftar pada course ini.',
        };
      }
      if (err.constraint?.includes('categories')) {
        return {
          status: 409,
          error: 'Nama atau slug kategori sudah digunakan.',
        };
      }
      return {
        status: 409,
        error: 'Data duplikat terdeteksi di sistem.',
      };

    case '23001':
    case '23503':
      if (err.constraint?.includes('category_id')) {
        return {
          status: 409,
          error: 'Kategori tidak dapat dihapus karena masih digunakan oleh course.',
        };
      }
      return {
        status: 400,
        error: 'Referensi data terkait tidak ditemukan atau masih digunakan.',
      };

    case '23514':
      return {
        status: 400,
        error: 'Nilai input tidak sesuai dengan aturan validasi database.',
      };

    default:
      return null;
  }
}

export default pool;
