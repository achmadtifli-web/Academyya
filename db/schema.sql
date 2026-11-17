-- Academyya LMS PostgreSQL Schema (DDL)
-- Driver: pg (Raw SQL only, no ORM)

DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS material_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS teacher_applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'student'
                CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE teacher_applications (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expertise     VARCHAR(150) NOT NULL,
  motivation    TEXT,
  portfolio_url TEXT,
  status        VARCHAR(10) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  review_note   TEXT,
  reviewed_at   TIMESTAMP,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(50)
);

CREATE TABLE courses (
  id            BIGSERIAL PRIMARY KEY,
  teacher_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title         VARCHAR(200) NOT NULL,
  slug          VARCHAR(220) NOT NULL UNIQUE,
  description   TEXT,
  thumbnail_url TEXT,
  level         VARCHAR(10) NOT NULL DEFAULT 'pemula'
                CHECK (level IN ('pemula', 'menengah', 'lanjut')),
  status        VARCHAR(10) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- DEFERRABLE INITIALLY DEFERRED allows reordering positions 1..N within a transaction without transient collisions.
CREATE TABLE materials (
  id               BIGSERIAL PRIMARY KEY,
  course_id        BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  content          TEXT,
  video_url        TEXT,
  position         INT NOT NULL CHECK (position > 0),
  duration_minutes INT NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_materials_course_position UNIQUE (course_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE enrollments (
  id           BIGSERIAL PRIMARY KEY,
  student_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status       VARCHAR(10) NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'completed')),
  enrolled_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT uq_enrollments_student_course UNIQUE (student_id, course_id)
);

CREATE TABLE material_progress (
  id            BIGSERIAL PRIMARY KEY,
  enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  material_id   BIGINT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  is_completed  BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at  TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_progress_enrollment_material UNIQUE (enrollment_id, material_id)
);

CREATE TABLE discussions (
  id          BIGSERIAL PRIMARY KEY,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   BIGINT REFERENCES discussions(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE certificates (
  id               BIGSERIAL PRIMARY KEY,
  enrollment_id    BIGINT NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_code VARCHAR(40) NOT NULL UNIQUE,
  issued_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(150) NOT NULL,
  message    TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id         BIGSERIAL PRIMARY KEY,
  course_id  BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reviews_course_student UNIQUE (course_id, student_id)
);

CREATE TABLE bookmarks (
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);

CREATE INDEX idx_users_role               ON users(role);
CREATE INDEX idx_teacher_apps_user_status ON teacher_applications(user_id, status);
CREATE INDEX idx_courses_category         ON courses(category_id);
CREATE INDEX idx_courses_teacher          ON courses(teacher_id);
CREATE INDEX idx_courses_status           ON courses(status);
CREATE INDEX idx_materials_course_pos     ON materials(course_id, position);
CREATE INDEX idx_enrollments_student      ON enrollments(student_id);
CREATE INDEX idx_enrollments_course       ON enrollments(course_id);
CREATE INDEX idx_progress_enrollment      ON material_progress(enrollment_id);
CREATE INDEX idx_discussions_material     ON discussions(material_id, created_at);
CREATE INDEX idx_notifications_user_read  ON notifications(user_id, is_read);
