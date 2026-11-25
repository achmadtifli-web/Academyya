import path from 'node:path';
import { deleteStoredFileByUrl, saveUploadedImageFile } from '@/lib/uploadStorage';

export const COURSE_THUMBNAIL_UPLOAD_DIR = path.join(
  process.cwd(),
  'storage',
  'uploads',
  'courses'
);
export const COURSE_THUMBNAIL_URL_PREFIX = '/api/uploads/courses/';
export const MAX_COURSE_THUMBNAIL_BYTES = 5 * 1024 * 1024;
export const COURSE_THUMBNAIL_FILENAME_REGEX = /^course-\d+-[a-f0-9]+\.(jpg|png|webp)$/;

/**
 * Validate and persist a teacher-uploaded course catalog cover photo.
 */
export async function saveCourseThumbnailFile(teacherId, file) {
  const result = await saveUploadedImageFile({
    uploadDir: COURSE_THUMBNAIL_UPLOAD_DIR,
    urlPrefix: COURSE_THUMBNAIL_URL_PREFIX,
    filenamePrefix: 'course',
    ownerId: teacherId,
    file,
    maxBytes: MAX_COURSE_THUMBNAIL_BYTES,
    sizeErrorMessage: 'Ukuran foto sampul course maksimal 5 MB.',
  });

  if (result.error) return { error: result.error };
  return { thumbnailUrl: result.url };
}

/**
 * Delete a previously stored course cover file if it belongs to local upload storage.
 */
export async function deleteStoredCourseThumbnailByUrl(thumbnailUrl) {
  return deleteStoredFileByUrl({
    fileUrl: thumbnailUrl,
    urlPrefix: COURSE_THUMBNAIL_URL_PREFIX,
    uploadDir: COURSE_THUMBNAIL_UPLOAD_DIR,
    filenameRegex: COURSE_THUMBNAIL_FILENAME_REGEX,
  });
}
