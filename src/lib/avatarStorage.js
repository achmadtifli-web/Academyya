import path from 'node:path';
import {
  deleteStoredImageByUrl,
  detectImageFormat,
  getMimeByFilename,
  saveUploadedImageFile,
} from '@/lib/uploadStorage';

export const AVATAR_UPLOAD_DIR = path.join(process.cwd(), 'storage', 'uploads', 'avatars');
export const AVATAR_URL_PREFIX = '/api/uploads/avatars/';
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_FILENAME_REGEX = /^avatar-\d+-[a-f0-9]+\.(jpg|png|webp)$/;

export { detectImageFormat, getMimeByFilename };

/**
 * Validate and persist a user profile avatar image.
 */
export async function saveUserAvatarFile(userId, file) {
  const result = await saveUploadedImageFile({
    uploadDir: AVATAR_UPLOAD_DIR,
    urlPrefix: AVATAR_URL_PREFIX,
    filenamePrefix: 'avatar',
    ownerId: userId,
    file,
    maxBytes: MAX_AVATAR_BYTES,
    sizeErrorMessage: 'Ukuran foto profil maksimal 2 MB.',
  });

  if (result.error) return { error: result.error };
  return { avatarUrl: result.url };
}

/**
 * Delete a previously stored local user avatar file if its URL matches local storage.
 */
export async function deleteStoredAvatarByUrl(avatarUrl) {
  return deleteStoredImageByUrl({
    fileUrl: avatarUrl,
    urlPrefix: AVATAR_URL_PREFIX,
    uploadDir: AVATAR_UPLOAD_DIR,
    filenameRegex: AVATAR_FILENAME_REGEX,
  });
}
