import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const TEACHER_CV_UPLOAD_DIR = path.join(
  process.cwd(),
  'storage',
  'uploads',
  'cv'
);
export const TEACHER_CV_URL_PREFIX = '/api/uploads/cv/';
export const MAX_TEACHER_CV_BYTES = 5 * 1024 * 1024;
export const TEACHER_CV_FILENAME_REGEX = /^cv-[a-z0-9-]+-[a-f0-9]+\.pdf$/;

/**
 * Inspect PDF magic bytes (%PDF-) so non-PDF payloads with spoofed extensions/MIME types are rejected.
 */
export function isValidPdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 5) {
    return false;
  }
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

/**
 * Validate and persist an uploaded teacher applicant CV PDF.
 */
export async function saveTeacherCvFile(file, ownerTag = 'applicant') {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return { error: 'Unggah file CV dalam format PDF (wajib).' };
  }

  if (file.size > MAX_TEACHER_CV_BYTES) {
    return { error: 'Ukuran file CV maksimal 5 MB.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isValidPdfBuffer(buffer)) {
    return { error: 'File CV harus berupa dokumen PDF (.pdf) yang valid.' };
  }

  await fs.mkdir(TEACHER_CV_UPLOAD_DIR, { recursive: true });
  const safeTag = String(ownerTag || 'applicant')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 24) || 'applicant';
  const filename = `cv-${safeTag}-${crypto.randomBytes(8).toString('hex')}.pdf`;
  const fullPath = path.join(TEACHER_CV_UPLOAD_DIR, filename);
  await fs.writeFile(fullPath, buffer);

  return { cvUrl: `${TEACHER_CV_URL_PREFIX}${filename}` };
}

/**
 * Remove a stored CV PDF matching the expected prefix and filename pattern.
 */
export async function deleteStoredTeacherCvByUrl(cvUrl) {
  if (!cvUrl || typeof cvUrl !== 'string') return;
  if (!cvUrl.startsWith(TEACHER_CV_URL_PREFIX)) return;

  const filename = cvUrl.slice(TEACHER_CV_URL_PREFIX.length);
  if (!TEACHER_CV_FILENAME_REGEX.test(filename)) return;

  const fullPath = path.join(TEACHER_CV_UPLOAD_DIR, filename);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    if (err?.code !== 'ENOENT') {
      // Ignore cleanup errors after failed DB transaction.
    }
  }
}
