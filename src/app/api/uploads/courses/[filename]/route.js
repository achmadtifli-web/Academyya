import {
  COURSE_THUMBNAIL_FILENAME_REGEX,
  COURSE_THUMBNAIL_UPLOAD_DIR,
} from '@/lib/courseThumbnailStorage';
import { serveStoredImageResponse } from '@/lib/uploadStorage';

export async function GET(_request, context) {
  const { filename } = await context.params;
  return serveStoredImageResponse({
    uploadDir: COURSE_THUMBNAIL_UPLOAD_DIR,
    filenameRegex: COURSE_THUMBNAIL_FILENAME_REGEX,
    filename,
  });
}
