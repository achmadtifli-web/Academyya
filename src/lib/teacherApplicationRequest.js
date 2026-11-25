/**
 * Parse a teacher registration or application request supporting multipart/form-data (with CV file) and JSON.
 */
export async function parseTeacherRequestPayload(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return { ok: false, error: 'Data formulir tidak valid.' };
    }

    const body = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        body[key] = value;
      }
    }

    const rawCv = formData.get('cv');
    const hasCvFile =
      rawCv &&
      typeof rawCv === 'object' &&
      typeof rawCv.arrayBuffer === 'function' &&
      (rawCv.size > 0 || Boolean(rawCv.name));

    return {
      ok: true,
      body,
      cvFile: hasCvFile ? rawCv : null,
    };
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Permintaan tidak valid.' };
  }

  return {
    ok: true,
    body,
    cvFile: null,
  };
}
