const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const LOCAL_UPLOADED_COURSE_IMAGE_REGEX =
  /^\/api\/uploads\/courses\/course-\d+-[a-f0-9]+\.(jpg|png|webp)$/;

export function isValidImageSource(value) {
  if (!value) return true;
  const trimmed = String(value).trim();
  if (trimmed.startsWith('/images/') && !trimmed.startsWith('//') && !trimmed.includes('..')) {
    return true;
  }
  if (LOCAL_UPLOADED_COURSE_IMAGE_REGEX.test(trimmed)) {
    return true;
  }
  return isValidHttpUrl(trimmed);
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Prevent open-redirect attacks by allowing only relative app paths.
 */
export function sanitizeCallbackUrl(url, fallback = '/dashboard') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  return trimmed;
}

/**
 * Normalize common YouTube and Vimeo links to embeddable iframe URLs.
 */
export function toEmbedVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return trimmed;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const videoId = parsed.pathname.split('/')[2];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace('/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (host === 'vimeo.com') {
      const videoId = parsed.pathname.replace('/', '').split('/')[0];
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    if (host === 'player.vimeo.com' || host === 'youtube-nocookie.com') {
      return trimmed;
    }

    return trimmed;
  } catch {
    return null;
  }
}

export function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

export function validateRegisterPayload(body) {
  const fieldErrors = {};
  const name = String(body?.name || '').trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || '');
  const accountType = body?.accountType === 'teacher' ? 'teacher' : 'student';
  const expertise = String(body?.expertise || '').trim();
  const motivation = String(body?.motivation || '').trim();
  const portfolioUrl = String(body?.portfolio_url || '').trim();

  if (name.length < 2 || name.length > 100) {
    fieldErrors.name = 'Nama lengkap harus antara 2 sampai 100 karakter.';
  }
  if (!isValidEmail(email) || email.length > 150) {
    fieldErrors.email = 'Masukkan alamat email yang valid.';
  }
  if (password.length < 8) {
    fieldErrors.password = 'Kata sandi minimal 8 karakter.';
  }

  if (accountType === 'teacher') {
    if (expertise.length < 3 || expertise.length > 150) {
      fieldErrors.expertise = 'Bidang keahlian minimal 3 karakter.';
    }
    if (motivation.length < 10) {
      fieldErrors.motivation = 'Motivasi mengajar minimal 10 karakter.';
    }
    if (portfolioUrl && !isValidHttpUrl(portfolioUrl)) {
      fieldErrors.portfolio_url = 'URL portofolio harus diawali http:// atau https://.';
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      name,
      email,
      password,
      accountType,
      expertise,
      motivation,
      portfolio_url: portfolioUrl || null,
    },
  };
}

export function validateCoursePayload(body) {
  const fieldErrors = {};
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const categoryId = parsePositiveInt(body?.category_id);
  const level = String(body?.level || 'pemula').trim();
  const thumbnailUrl = String(body?.thumbnail_url || '').trim();

  if (title.length < 5 || title.length > 200) {
    fieldErrors.title = 'Judul course harus antara 5 sampai 200 karakter.';
  }
  if (description.length < 20) {
    fieldErrors.description = 'Deskripsi course minimal 20 karakter.';
  }
  if (!categoryId) {
    fieldErrors.category_id = 'Pilih kategori course yang valid.';
  }
  if (!['pemula', 'menengah', 'lanjut'].includes(level)) {
    fieldErrors.level = 'Level harus pemula, menengah, atau lanjut.';
  }
  if (thumbnailUrl && !isValidImageSource(thumbnailUrl)) {
    fieldErrors.thumbnail_url = 'URL thumbnail harus diawali http://, https://, atau /images/.';
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      title,
      description,
      category_id: categoryId,
      level,
      thumbnail_url: thumbnailUrl || null,
    },
  };
}

export function validateMaterialPayload(body) {
  const fieldErrors = {};
  const title = String(body?.title || '').trim();
  const content = String(body?.content || '').trim();
  const videoUrl = String(body?.video_url || '').trim();
  const rawDuration = body?.duration_minutes === '' || body?.duration_minutes === undefined
    ? 0
    : Number(body?.duration_minutes);

  if (title.length < 3 || title.length > 200) {
    fieldErrors.title = 'Judul materi harus antara 3 sampai 200 karakter.';
  }
  if (!content && !videoUrl) {
    fieldErrors.content = 'Isi konten materi atau URL video pembelajaran.';
  }
  if (videoUrl && !isValidHttpUrl(videoUrl)) {
    fieldErrors.video_url = 'URL video harus diawali http:// atau https://.';
  }
  if (!Number.isInteger(rawDuration) || rawDuration < 0 || rawDuration > 600) {
    fieldErrors.duration_minutes = 'Durasi harus bilangan bulat antara 0 sampai 600 menit.';
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      title,
      content: content || null,
      video_url: videoUrl || null,
      duration_minutes: rawDuration,
    },
  };
}

export function validateCategoryPayload(body) {
  const fieldErrors = {};
  const name = String(body?.name || '').trim();
  const description = String(body?.description || '').trim();
  const icon = String(body?.icon || 'BookOpen').trim();

  if (name.length < 2 || name.length > 80) {
    fieldErrors.name = 'Nama kategori harus antara 2 sampai 80 karakter.';
  }
  if (icon.length > 50) {
    fieldErrors.icon = 'Nama ikon maksimal 50 karakter.';
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      name,
      description: description || null,
      icon: icon || 'BookOpen',
    },
  };
}
