import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Inspect image magic bytes so spoofed MIME types or non-raster payloads (e.g. SVG) are rejected.
 */
export function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: 'png', mime: 'image/png' };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }

  return null;
}

/**
 * Return the MIME type for a validated image filename extension.
 */
export function getMimeByFilename(filename) {
  const ext = String(filename || '').split('.').pop()?.toLowerCase();
  return MIME_BY_EXT[ext] || null;
}

/**
 * Validate and persist an uploaded raster image under a controlled local directory.
 */
export async function saveUploadedImageFile({
  uploadDir,
  urlPrefix,
  filenamePrefix,
  ownerId,
  file,
  maxBytes,
  sizeErrorMessage,
}) {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return { error: 'Pilih file gambar yang valid.' };
  }

  if (file.size > maxBytes) {
    return { error: sizeErrorMessage };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const format = detectImageFormat(buffer);
  if (!format) {
    return { error: 'Format foto harus JPG, PNG, atau WebP yang valid.' };
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `${filenamePrefix}-${ownerId}-${crypto.randomBytes(8).toString('hex')}.${format.ext}`;
  const fullPath = path.join(uploadDir, filename);
  await fs.writeFile(fullPath, buffer);

  return { url: `${urlPrefix}${filename}` };
}

/**
 * Remove a stored uploaded file matching the expected URL prefix and filename pattern.
 */
export async function deleteStoredFileByUrl({ fileUrl, urlPrefix, uploadDir, filenameRegex }) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  if (!fileUrl.startsWith(urlPrefix)) return;

  const filename = fileUrl.slice(urlPrefix.length);
  if (!filenameRegex.test(filename)) return;

  const fullPath = path.join(uploadDir, filename);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    if (err?.code !== 'ENOENT') {
      // Ignore cleanup errors after DB commit so primary mutations remain successful.
    }
  }
}

/**
 * Serve an uploaded image safely with strict filename verification and nosniff headers.
 */
export async function serveStoredImageResponse({ uploadDir, filenameRegex, filename }) {
  if (!filename || !filenameRegex.test(filename)) {
    return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 404 });
  }

  const mime = getMimeByFilename(filename);
  if (!mime) {
    return NextResponse.json({ success: false, error: 'Format file tidak didukung.' }, { status: 404 });
  }

  const fullPath = path.join(uploadDir, filename);
  try {
    const fileBuffer = await fs.readFile(fullPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(fileBuffer.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 404 });
  }
}
