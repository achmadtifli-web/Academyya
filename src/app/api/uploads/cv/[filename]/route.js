import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  TEACHER_CV_FILENAME_REGEX,
  TEACHER_CV_UPLOAD_DIR,
  TEACHER_CV_URL_PREFIX,
} from '@/lib/teacherCvStorage';

export async function GET(_request, context) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  const { filename } = await context.params;
  if (!filename || !TEACHER_CV_FILENAME_REGEX.test(filename)) {
    return NextResponse.json({ success: false, error: 'File CV tidak ditemukan.' }, { status: 404 });
  }

  if (user.role !== 'admin') {
    const cvUrl = `${TEACHER_CV_URL_PREFIX}${filename}`;
    const ownerRes = await query(
      `SELECT 1 FROM teacher_applications WHERE cv_url = $1 AND user_id = $2 LIMIT 1`,
      [cvUrl, user.id]
    );
    if (ownerRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki izin mengakses file CV ini.' },
        { status: 403 }
      );
    }
  }

  const fullPath = path.join(TEACHER_CV_UPLOAD_DIR, filename);
  try {
    const fileBuffer = await fs.readFile(fullPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'File CV tidak ditemukan.' }, { status: 404 });
  }
}
