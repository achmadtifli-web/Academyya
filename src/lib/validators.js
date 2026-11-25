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

const ID_SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function parseCalendarDate(value) {
  if (value === null || value === undefined) return { valid: true, value: null };
  const trimmed = String(value).trim();
  if (!trimmed) return { valid: true, value: null };

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return { valid: false, value: null };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcCheck = new Date(Date.UTC(year, month - 1, day));

  if (
    utcCheck.getUTCFullYear() !== year ||
    utcCheck.getUTCMonth() + 1 !== month ||
    utcCheck.getUTCDate() !== day
  ) {
    return { valid: false, value: null };
  }

  return { valid: true, value: trimmed };
}

export function formatPlainDateId(dateStr) {
  if (!dateStr) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (!match) return String(dateStr);
  const year = match[1];
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  return `${day} ${ID_SHORT_MONTHS[monthIdx] || match[2]} ${year}`;
}

export function getTodayCalendarDate(referenceDate = new Date(), timeZone = 'Asia/Jakarta') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(referenceDate);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function getCourseScheduleState(course, referenceDate = new Date()) {
  const startRes = parseCalendarDate(course?.start_date);
  const endRes = parseCalendarDate(course?.end_date);
  const startDate = startRes.valid ? startRes.value : null;
  const endDate = endRes.valid ? endRes.value : null;
  const today =
    typeof referenceDate === 'string'
      ? referenceDate
      : getTodayCalendarDate(referenceDate);

  const startDateLabel = startDate ? formatPlainDateId(startDate) : null;
  const endDateLabel = endDate ? formatPlainDateId(endDate) : null;

  if (startDate && today < startDate) {
    return {
      state: 'upcoming',
      canEnroll: false,
      startDate,
      endDate,
      startDateLabel,
      endDateLabel,
    };
  }

  if (endDate && today > endDate) {
    return {
      state: 'ended',
      canEnroll: false,
      startDate,
      endDate,
      startDateLabel,
      endDateLabel,
    };
  }

  return {
    state: 'open',
    canEnroll: true,
    startDate,
    endDate,
    startDateLabel,
    endDateLabel,
  };
}

export function formatCourseDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'Lifetime Access';
  if (startDate && endDate) {
    return `${formatPlainDateId(startDate)} - ${formatPlainDateId(endDate)}`;
  }
  if (startDate) return `Mulai ${formatPlainDateId(startDate)}`;
  return `Hingga ${formatPlainDateId(endDate)}`;
}

export function getTeacherMailtoHref(email, courseTitle = '') {
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail) return null;
  const subject = courseTitle ? `Pertanyaan Course: ${courseTitle}` : 'Pertanyaan Course';
  return `mailto:${cleanEmail}?subject=${encodeURIComponent(subject)}`;
}

export function getTeacherGmailHref(email, courseTitle = '') {
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail) return null;
  const subject = courseTitle ? `Pertanyaan Course: ${courseTitle}` : 'Pertanyaan Course';
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanEmail)}&su=${encodeURIComponent(subject)}`;
}

export function validateTeacherApplicationPayload(body) {
  const fieldErrors = {};
  const expertise = String(body?.expertise || '').trim();
  const motivation = String(body?.motivation || '').trim();
  const portfolioUrl = String(body?.portfolio_url || '').trim();

  if (expertise.length < 3 || expertise.length > 150) {
    fieldErrors.expertise = 'Bidang keahlian minimal 3 karakter.';
  }
  if (motivation.length < 10) {
    fieldErrors.motivation = 'Motivasi mengajar minimal 10 karakter.';
  }
  if (portfolioUrl && !isValidHttpUrl(portfolioUrl)) {
    fieldErrors.portfolio_url = 'URL portofolio harus diawali http:// atau https://.';
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      expertise,
      motivation,
      portfolio_url: portfolioUrl || null,
    },
  };
}

export function validateRegisterPayload(body) {
  const fieldErrors = {};
  const name = String(body?.name || '').trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || '');
  const hasConfirmPassword =
    Boolean(body) &&
    (Object.prototype.hasOwnProperty.call(body, 'confirmPassword') ||
      Object.prototype.hasOwnProperty.call(body, 'confirm_password'));
  const confirmPassword = String(body?.confirmPassword ?? body?.confirm_password ?? '');
  const accountType = body?.accountType === 'teacher' ? 'teacher' : 'student';

  if (name.length < 2 || name.length > 100) {
    fieldErrors.name = 'Nama lengkap harus antara 2 sampai 100 karakter.';
  }
  if (!isValidEmail(email) || email.length > 150) {
    fieldErrors.email = 'Masukkan alamat email yang valid.';
  }
  if (password.length < 8) {
    fieldErrors.password = 'Kata sandi minimal 8 karakter.';
  }
  if (hasConfirmPassword) {
    if (!confirmPassword) {
      fieldErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.';
    } else if (confirmPassword !== password) {
      fieldErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok dengan kata sandi.';
    }
  }

  const teacherValidation = validateTeacherApplicationPayload(body);
  if (accountType === 'teacher') {
    Object.assign(fieldErrors, teacherValidation.fieldErrors);
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      name,
      email,
      password,
      accountType,
      expertise: teacherValidation.data.expertise,
      motivation: teacherValidation.data.motivation,
      portfolio_url: teacherValidation.data.portfolio_url,
    },
  };
}

export function validateAdminUserPayload(body, { isEditing = false } = {}) {
  const fieldErrors = {};
  const name = String(body?.name ?? body?.username ?? '').trim();
  const email = normalizeEmail(body?.email);
  const rawPassword = body?.password === undefined || body?.password === null
    ? ''
    : String(body.password);
  const role = String(body?.role || 'student').trim().toLowerCase();

  if (name.length < 2 || name.length > 100) {
    fieldErrors.name = 'Username / nama harus antara 2 sampai 100 karakter.';
  }
  if (!isValidEmail(email) || email.length > 150) {
    fieldErrors.email = 'Masukkan alamat email yang valid.';
  }
  if (!isEditing) {
    if (rawPassword.length < 8) {
      fieldErrors.password = 'Kata sandi minimal 8 karakter.';
    }
  } else if (rawPassword.length > 0 && rawPassword.length < 8) {
    fieldErrors.password = 'Kata sandi baru minimal 8 karakter.';
  }
  if (!['admin', 'teacher', 'student'].includes(role)) {
    fieldErrors.role = 'Pilih peran pengguna yang valid (student, teacher, atau admin).';
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      name,
      email,
      password: rawPassword || null,
      role,
    },
  };
}

export function validateCoursePayload(body, { requireTeacherId = false } = {}) {
  const fieldErrors = {};
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const categoryId = parsePositiveInt(body?.category_id);
  const teacherId = parsePositiveInt(body?.teacher_id);
  const level = String(body?.level || 'pemula').trim();
  const thumbnailUrl = String(body?.thumbnail_url || '').trim();
  const startDateRes = parseCalendarDate(body?.start_date);
  const endDateRes = parseCalendarDate(body?.end_date);

  if (title.length < 5 || title.length > 200) {
    fieldErrors.title = 'Judul course harus antara 5 sampai 200 karakter.';
  }
  if (description.length < 20) {
    fieldErrors.description = 'Deskripsi course minimal 20 karakter.';
  }
  if (!categoryId) {
    fieldErrors.category_id = 'Pilih kategori course yang valid.';
  }
  if (requireTeacherId && !teacherId) {
    fieldErrors.teacher_id = 'Pilih guru pengajar (teacher) yang valid.';
  }
  if (!['pemula', 'menengah', 'lanjut'].includes(level)) {
    fieldErrors.level = 'Level harus pemula, menengah, atau lanjut.';
  }
  if (thumbnailUrl && !isValidImageSource(thumbnailUrl)) {
    fieldErrors.thumbnail_url = 'URL thumbnail harus diawali http://, https://, atau /images/.';
  }
  if (!startDateRes.valid) {
    fieldErrors.start_date = 'Format tanggal mulai tidak valid.';
  }
  if (!endDateRes.valid) {
    fieldErrors.end_date = 'Format tanggal selesai tidak valid.';
  }
  if (
    startDateRes.valid &&
    endDateRes.valid &&
    startDateRes.value &&
    endDateRes.value &&
    endDateRes.value < startDateRes.value
  ) {
    fieldErrors.end_date = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      title,
      description,
      category_id: categoryId,
      ...(requireTeacherId ? { teacher_id: teacherId } : {}),
      start_date: startDateRes.value,
      end_date: endDateRes.value,
      level,
      thumbnail_url: thumbnailUrl || null,
    },
  };
}

export function validateMaterialPayload(body, { allowPosition = false } = {}) {
  const fieldErrors = {};
  const title = String(body?.title || '').trim();
  const content = String(body?.content || '').trim();
  const videoUrl = String(body?.video_url || '').trim();
  const rawDuration = body?.duration_minutes === '' || body?.duration_minutes === undefined
    ? 0
    : Number(body?.duration_minutes);
  const rawPosition = body?.position;
  let parsedPosition = null;

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
  if (
    allowPosition &&
    rawPosition !== undefined &&
    rawPosition !== null &&
    String(rawPosition).trim() !== ''
  ) {
    parsedPosition = parsePositiveInt(rawPosition);
    if (!parsedPosition) {
      fieldErrors.position = 'Urutan materi harus berupa angka bulat minimal 1.';
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      title,
      content: content || null,
      video_url: videoUrl || null,
      duration_minutes: rawDuration,
      ...(parsedPosition ? { position: parsedPosition } : {}),
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

export function getCourseDeleteGuard(course) {
  const isPublished = course?.status === 'published';
  const activeStudents = Number(course?.active_students || 0);

  if (isPublished && activeStudents > 0) {
    return {
      blocked: true,
      shortReason: `Published · ${activeStudents} siswa aktif`,
      message: `Course tidak dapat dihapus karena masih berstatus published dan diikuti ${activeStudents} siswa aktif.`,
    };
  }
  if (isPublished) {
    return {
      blocked: true,
      shortReason: 'Masih published (ubah ke draft dulu)',
      message:
        'Course tidak dapat dihapus karena masih berstatus published. Ubah ke status draft terlebih dahulu.',
    };
  }
  if (activeStudents > 0) {
    return {
      blocked: true,
      shortReason: `${activeStudents} siswa masih aktif`,
      message: `Course tidak dapat dihapus karena masih diikuti ${activeStudents} siswa aktif.`,
    };
  }

  return { blocked: false, shortReason: null, message: null };
}
