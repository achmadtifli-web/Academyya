import { validateCoursePayload } from '@/lib/validators';

/**
 * Parse a teacher course creation/update request supporting both multipart/form-data and JSON.
 */
export async function parseCourseRequest(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return { ok: false, error: 'Data formulir tidak valid.' };
    }

    const rawThumbnail = formData.get('thumbnail');
    const hasFile =
      rawThumbnail &&
      typeof rawThumbnail === 'object' &&
      typeof rawThumbnail.arrayBuffer === 'function' &&
      (rawThumbnail.size > 0 || Boolean(rawThumbnail.name));

    const hasThumbnailUrlField = formData.has('thumbnail_url');
    const body = {
      title: formData.get('title'),
      category_id: formData.get('category_id'),
      level: formData.get('level'),
      description: formData.get('description'),
      status: formData.get('status'),
      thumbnail_url: hasThumbnailUrlField ? formData.get('thumbnail_url') : '',
    };

    const validation = validateCoursePayload(body);
    return {
      ok: true,
      validation,
      rawStatus: typeof body.status === 'string' ? body.status : null,
      thumbnailFile: hasFile ? rawThumbnail : null,
      removeThumbnail: formData.get('removeThumbnail') === 'true',
      hasThumbnailUrlField,
    };
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Data tidak valid.' };
  }

  const hasThumbnailUrlField = Object.prototype.hasOwnProperty.call(body, 'thumbnail_url');
  const validation = validateCoursePayload(body);
  return {
    ok: true,
    validation,
    rawStatus: typeof body.status === 'string' ? body.status : null,
    thumbnailFile: null,
    removeThumbnail: body.removeThumbnail === true,
    hasThumbnailUrlField,
  };
}
