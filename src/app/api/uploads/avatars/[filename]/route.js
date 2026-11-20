import { AVATAR_FILENAME_REGEX, AVATAR_UPLOAD_DIR } from '@/lib/avatarStorage';
import { serveStoredImageResponse } from '@/lib/uploadStorage';

export async function GET(_request, context) {
  const { filename } = await context.params;
  return serveStoredImageResponse({
    uploadDir: AVATAR_UPLOAD_DIR,
    filenameRegex: AVATAR_FILENAME_REGEX,
    filename,
  });
}
