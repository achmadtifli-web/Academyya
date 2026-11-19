const COURSE_COVER_BY_SLUG = {
  'dasar-pemrograman-web-modern': '/images/courses/dasar-pemrograman-web-modern.jpg',
  'menguasai-postgresql-raw-sql': '/images/courses/menguasai-postgresql-raw-sql.jpg',
  'prinsip-desain-ui-ux-ramah-semua-usia': '/images/courses/prinsip-desain-ui-ux-ramah-semua-usia.jpg',
  'membangun-design-system-tailwind-css': '/images/courses/membangun-design-system-tailwind-css.jpg',
  'keamanan-digital-anti-penipuan-online': '/images/courses/keamanan-digital-anti-penipuan-online.jpg',
  'manajemen-waktu-komunikasi-efektif': '/images/courses/manajemen-waktu-komunikasi-efektif.jpg',
};

const CATEGORY_DEFAULT_COVERS = {
  'teknologi-pemrograman': '/images/courses/dasar-pemrograman-web-modern.jpg',
  'desain-ui-ux': '/images/courses/prinsip-desain-ui-ux-ramah-semua-usia.jpg',
  'bisnis-produktivitas': '/images/courses/manajemen-waktu-komunikasi-efektif.jpg',
  'literasi-digital': '/images/courses/keamanan-digital-anti-penipuan-online.jpg',
  'bahasa-komunikasi': '/images/courses/bahasa-komunikasi.jpg',
  'persiapan-snbt': '/images/courses/persiapan-snbt.jpg',
};

const DEFAULT_COURSE_COVER = '/images/courses/dasar-pemrograman-web-modern.jpg';

export function getCourseThumbnail(course) {
  if (course?.thumbnail_url && String(course.thumbnail_url).trim()) {
    return String(course.thumbnail_url).trim();
  }
  if (course?.slug && COURSE_COVER_BY_SLUG[course.slug]) {
    return COURSE_COVER_BY_SLUG[course.slug];
  }
  if (course?.category_slug && CATEGORY_DEFAULT_COVERS[course.category_slug]) {
    return CATEGORY_DEFAULT_COVERS[course.category_slug];
  }
  return DEFAULT_COURSE_COVER;
}
