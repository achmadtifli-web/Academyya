<div align="center">

<img src="public/logo.png" alt="Logo Academyya" width="160" />

# Academyya LMS 🎓📚

**Learn Skills. Build Your Future.**
Platform Learning Management System Berbasis Web dengan Sertifikat Digital Terverifikasi

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pg-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-jose_HS256-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**Tugas Mata Kuliah Pemrograman Web - Universitas Hasanuddin**

</div>

Academyya adalah aplikasi **Learning Management System (LMS)** berbasis web yang dibangun dengan **Next.js (App Router)** dan **PostgreSQL** (`pg`, raw SQL terparameter tanpa ORM). Platform ini mendukung pembelajaran terstruktur untuk tiga peran pengguna (**Student**, **Teacher**, dan **Admin**), lengkap dengan pelacakan progres materi, forum diskusi, notifikasi in-app, serta penerbitan dan verifikasi sertifikat digital.

---

## 📑 Daftar Isi

- [✨ Core Features & Technical Implementation](#-core-features--technical-implementation)
- [🛠️ Tech Stack](#️-tech-stack)
- [📐 System Architecture](#-system-architecture)
- [🗄️ Database Schema](#️-database-schema)
- [📂 Struktur Direktori](#-struktur-direktori)
- [🌐 REST API Endpoints](#-rest-api-endpoints)
- [🚀 Panduan Instalasi Lokal](#-panduan-instalasi-lokal)
- [🧪 Testing & Deployment](#-testing--deployment)

---

## ✨ Core Features & Technical Implementation

### 1. 🌐 Halaman Publik & Eksplorasi Katalog

- **Beranda (`/`)**: Ringkasan statistik platform (`total_courses`, `total_students`, `total_teachers`), hingga 4 course terpopuler, panduan 4 langkah cara belajar, FAQ interaktif (`FaqSection`), Hero Section berlapis (`HeroVisual` dengan animasi CSS GPU dan dukungan `prefers-reduced-motion`), serta banner ajakan mendaftar sebagai Teacher. Pengguna yang sudah login otomatis diarahkan ke dashboard sesuai perannya (`/dashboard`, `/teacher`, atau `/admin`).
- **Katalog Course (`/courses`)**: Pencarian berdasarkan judul/deskripsi, filter kategori dan level (pemula, menengah, lanjut), pengurutan (Terbaru / Terpopuler), dan paginasi (12 item per halaman) yang tersinkron ke parameter URL melalui `GET /api/courses`. Setiap kartu course (`CourseCard`) juga menampilkan badge **Bersertifikat** (untuk course final) serta status jadwal (*Mulai ...* / *Berakhir ...*). Bagi Student, akses **Jelajahi Katalog** tersedia langsung di Navbar.
- **Detail Course (`/courses/[slug]`)**: Informasi pengajar beserta tombol **Hubungi Pengajar** (`ContactTeacherButton`), metrik jumlah materi, total durasi, rentang tanggal kelas (`start_date`–`end_date` atau *Lifetime Access*), badge **Bersertifikat** dan status jadwal, silabus berurutan, serta status pendaftaran. Course berstatus *draft* hanya dapat diakses oleh pengajar pemiliknya atau Admin.

### 2. 🔐 Autentikasi & Otorisasi Berbasis Peran (RBAC)

- **Registrasi & Login**: Pendaftaran sebagai Student atau calon Teacher (`POST /api/auth/register`) lengkap dengan fitur **show/hide password** (`PasswordField`) dan **konfirmasi kata sandi**, serta login/logout (`POST /api/auth/login`, `POST /api/auth/logout`) dengan hash kata sandi `bcryptjs` (cost factor 10). Khusus pendaftaran calon Teacher, pelamar wajib mengunggah **CV dalam format PDF**.
- **Sesi JWT Cookie**: Token JWT HS256 (`jose`) berdurasi 7 hari yang disimpan pada HTTP-only cookie `academyya_session`.
- **Guard Bertingkat**: `src/middleware.js` memeriksa keabsahan cookie sesi untuk rute terproteksi (`/certificates`, `/dashboard`, `/learn`, `/profile`, `/teacher`, `/admin`), mengarahkan pengguna terautentikasi dari `/` ke panel masing-masing, serta mengalihkan Teacher/Admin dari `/courses`. Pengecekan peran database dijalankan oleh Server Component layout/halaman (`getCurrentUser()`) dan API guards (`requireApiAuth`, `requireApiRole`), lalu disinkronkan melalui `GET /api/auth/me`.

### 3. 📖 Ruang Belajar, Progres & Diskusi Materi

- **Enrollment Berbasis Jadwal & Ruang Belajar (`/learn/[course]/[materi]`)**: Student dapat mendaftar ke course *published* (`POST /api/enrollments`) apabila jadwal kelas sudah dibuka (`start_date` sudah tercapai dan belum melewati `end_date` berdasarkan zona waktu `Asia/Jakarta`, atau tanpa batas waktu/*Lifetime Access*). Ruang belajar menyediakan navigasi materi sebelumnya/berikutnya, pemutar video embed YouTube/Vimeo (`toEmbedVideoUrl`), konten teks multi-paragraf, serta mode pratinjau bagi pengajar pemilik dan Admin.
- **Pelacakan Progres (Mark as Done Permanen)**: Menandai materi selesai dalam **transaksi SQL** (`POST /api/progress/toggle`) sekaligus menghitung ulang persentase penyelesaian secara dinamis. Materi yang sudah ditandai selesai terkunci dan **tidak dapat dibatalkan** baik dari antarmuka maupun API.
- **Forum Diskusi Materi**: Tanya-jawab khusus peserta terdaftar, pengajar pemilik course, dan Admin (`GET/POST /api/materials/[id]/discussions`) dengan struktur pertanyaan induk dan balasan satu tingkat (`parent_id`).

### 4. 🏅 Finalisasi Course, Sertifikat Digital & Cetak PDF

- **Finalisasi Course & Penerbitan Sertifikat Otomatis**: Sertifikat hanya diterbitkan untuk course yang sudah **difinalisasi** (`finalized_at`). Jika Student menyelesaikan 100% materi sebelum course final, status enrollment menjadi `completed` dengan keterangan *Menunggu Finalisasi Pengajar*. Saat Teacher atau Admin menekan **Finalisasi Course**, sistem menjalankan transaksi SQL atomik untuk mengunci seluruh materi secara permanen, menerbitkan kode sertifikat unik (`ACAD-YYYY-XXXXXX`) bagi seluruh siswa yang sudah 100%, dan mengirim notifikasi in-app. Setelah course final, siswa yang mencapai 100% langsung memperoleh sertifikat otomatis.
- **Daftar & Verifikasi Publik**: Student melihat koleksinya di `/certificates`, sedangkan publik maupun API (`GET /api/certificates/[code]`) dapat memverifikasi dan mencetak sertifikat di `/certificates/[code]` dengan tata letak cetak **A4 lanskap** (297mm x 209.5mm).

### 5. 👤 Profil, Pengajuan Teacher, Notifikasi & Storage Lokal

- **Pengaturan Profil (`/profile`)**: Pembaruan nama, bio, kata sandi (dengan toggle *show/hide password*), dan foto profil (`PUT /api/profile` via `multipart/form-data` atau JSON). Jika akun pernah mendaftar sebagai Teacher, profil menampilkan riwayat pengajuan secara *read-only* beserta tautan CV yang diunggah.
- **Pengajuan Teacher & Notifikasi**: Pengajuan Teacher baru hanya dilakukan melalui menu **Daftar Teacher** (`/register?type=teacher`) dengan unggahan **CV PDF wajib** (`TeacherCvUploadField`). Pelamar yang ditolak dapat mengajukan ulang (*Ajukan Ulang*) dari Dashboard Student (`/api/teacher-applications`) dengan CV PDF wajib. Seluruh pengguna dapat memantau notifikasi melalui ikon lonceng pada Navbar (`/api/notifications`, `/api/notifications/read`).
- **Penyimpanan File Lokal**: Avatar (maks 2 MB) di `storage/uploads/avatars/`, sampul course (maks 5 MB) di `storage/uploads/courses/` (validasi *magic bytes* JPEG/PNG/WebP, menolak SVG), serta **CV pelamar Teacher** (PDF maks 5 MB, validasi *magic bytes* `%PDF-`) di `storage/uploads/cv/`. File disajikan melalui `/api/uploads/avatars/[filename]`, `/api/uploads/courses/[filename]`, dan endpoint privat `/api/uploads/cv/[filename]` (hanya dapat diakses oleh Admin atau pemilik pengajuan).

### 6. 🧑‍🏫 Panel Pengajar (`/teacher`) & 🛡️ Panel Admin (`/admin`)

- **Teacher Panel**: Ringkasan metrik mengajar, pembuatan dan penyuntingan course beserta jadwal tanggal (`start_date`–`end_date`) dan upload foto sampul (`FormData`), toggle *published/draft* (syarat minimal 1 materi), manajemen materi CRUD dan pengurutan ulang atomik (memanfaatkan constraint `DEFERRABLE INITIALLY DEFERRED`), **Finalisasi Course** (mengunci permanen materi, namun status tetap dapat dikembalikan ke *draft* jika course perlu diturunkan atau dihapus), dan pemantauan progres siswa (`/teacher/students`).
- **Admin Panel**: Statistik platform (`GET /api/admin/stats`), peninjauan pengajuan Teacher beserta tautan **Lihat CV Pelamar (PDF)** dan portofolio (approve/reject dengan promosi peran dan notifikasi transaksional), CRUD kategori (dilindungi `ON DELETE RESTRICT`), pembuatan/penyuntingan course (`/admin/courses/new`, `/admin/courses/[id]/edit`), moderasi status *published/draft*, **Finalisasi Course**, penghapusan course berproteksi, serta pengelolaan pengguna (`/admin/users`) dengan pencarian, filter peran/pelamar pending, paginasi, dan modal tambah/edit akun.

### 7. ♿ Aksesibilitas & UI

- Provider skala ukuran teks (`FontSizeProvider` / `FontSizeContext`), input kata sandi aksesibel (`PasswordField` dengan `aria-pressed` & `aria-label`), serta komponen upload dokumen (`TeacherCvUploadField`).
- Dukungan `@media (prefers-reduced-motion: reduce)`, navigasi `:focus-visible`, gaya dialog native (`dialog:modal` & `dialog::backdrop`), sistem toast notifikasi (`ToastContext`), serta `Modal` / `ConfirmModal` dengan penutupan via tombol `Escape` maupun backdrop.

---

## 🛠️ Tech Stack

Sesuai `package.json`, `next.config.mjs`, `eslint.config.mjs`, dan `jsconfig.json`:

| Kategori | Teknologi | Versi / Keterangan |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.4.6 (Turbopack CSS loader via `@tailwindcss/turbopack`) |
| UI Library | React & React DOM | 19.3.0 |
| Styling | Tailwind CSS & `@tailwindcss/turbopack` | 4.3.3 |
| Basis Data | PostgreSQL (`pg`) | ^8.23.1 (raw SQL terparameter, connection pool maks 20) |
| Keamanan & Sesi | `jose` & `bcryptjs` | ^6.2.17 (JWT HS256) & ^3.0.3 (password hashing) |
| Ikon | `lucide-react` | ^1.73.0 |
| Linter | ESLint & `eslint-config-next` | ^9 & 16.4.6 (core-web-vitals) |
| Path Alias | `jsconfig.json` | `@/*` mengarah ke `./src/*` |

---

## 📐 System Architecture

Aplikasi menggunakan arsitektur **Next.js full-stack**: Server Component dan Route Handler berjalan dalam satu proyek, dengan akses basis data langsung melalui raw SQL terparameter.

```mermaid
flowchart LR
    U["🌐 Browser<br/>(Guest / Student / Teacher / Admin)"] --> M["🛡️ middleware.js<br/>Guard cookie JWT"]
    M --> P["📄 Server Components<br/>getCurrentUser()"]
    M --> A["⚙️ Route Handlers /api/*<br/>requireApiAuth / requireApiRole"]
    P --> L["📦 src/lib<br/>db, auth, session, validators, queries"]
    A --> L
    L --> D[("🐘 PostgreSQL<br/>pool maks 20")]
    A --> S["🗂️ storage/uploads<br/>avatars, courses & cv"]
```

---

## 🗄️ Database Schema

Skema didefinisikan di `db/schema.sql` (**12 tabel & 11 indeks**) dengan seed demo di `db/seed.sql`. Beberapa keputusan desain penting:

| Aspek | Implementasi |
| --- | --- |
| Query | Raw SQL terparameter melalui `pg` (connection pool maks 20) |
| Konsistensi data | Progres materi, finalisasi course, dan penerbitan sertifikat dijalankan dalam transaksi SQL |
| Jadwal & finalisasi course | Kolom `start_date`, `end_date` (`CHECK end_date >= start_date`), dan `finalized_at` pada `courses` |
| Lampiran pelamar Teacher | Kolom `cv_url` pada tabel `teacher_applications` untuk file CV PDF |
| Urutan materi | Pengurutan ulang atomik dengan constraint `DEFERRABLE INITIALLY DEFERRED` |
| Integritas kategori | Relasi kategori dilindungi `ON DELETE RESTRICT` |
| Forum diskusi | Struktur induk-balasan satu tingkat melalui kolom `parent_id` |
| Kode sertifikat | Format unik `ACAD-YYYY-XXXXXX` |

> **Catatan:** Skema juga mendefinisikan tabel `reviews` dan `bookmarks`, namun keduanya belum digunakan oleh fitur atau API mana pun pada direktori `src/`.

---

## 📂 Struktur Direktori

```text
.
├── db/
│   ├── schema.sql                  # DDL PostgreSQL (12 tabel & 11 indeks)
│   └── seed.sql                    # Data awal demo (akun, kategori, course, materi)
├── public/
│   ├── images/courses/             # Gambar sampul default bawaan course
│   ├── logo.png                    # Logo Academyya (navbar, footer, sertifikat)
│   └── Object.svg                  # Ilustrasi utama Hero Section
├── src/
│   ├── middleware.js               # Guard sesi JWT Edge-safe & redirect berbasis peran
│   ├── app/
│   │   ├── globals.css             # Token @theme Tailwind v4, animasi Hero, gaya dialog, aturan print A4
│   │   ├── layout.js               # Root layout (Poppins, Inter, FontSizeProvider, ToastProvider)
│   │   ├── (public)/               # /, /courses, /courses/[slug], /certificates/[code], /login, /register
│   │   ├── (student)/              # /dashboard, /certificates, /profile, /learn/[course]/[materi]
│   │   ├── (teacher)/teacher/      # Teacher Panel: ringkasan, kelola & finalisasi course, materi, progres siswa
│   │   ├── (admin)/admin/          # Admin Panel: statistik, verifikasi teacher, kategori, kelola & moderasi course, pengguna
│   │   └── api/                    # 32 Route Handler API
│   ├── components/                 # Komponen UI per domain (admin, auth, course, home, layout, learning, student, teacher, ui)
│   └── lib/                        # Helper inti (db, auth, session, validators, courseMutations, uploadStorage, teacherCvStorage, queries/*)
├── storage/                        # Unggahan runtime: avatars, courses, cv (diabaikan di .gitignore)
├── .env.example                    # Contoh daftar nama variabel environment
├── eslint.config.mjs               # Konfigurasi ESLint
├── jsconfig.json                   # Alias path @/*
├── next.config.mjs                 # Konfigurasi Next.js (Turbopack CSS)
└── package.json                    # Dependensi dan script NPM
```

---

## 🌐 REST API Endpoints

Autentikasi memakai sesi JWT pada HTTP-only cookie `academyya_session`. Contoh beberapa jalur utama:

| Endpoint | Method | Akses | Deskripsi |
| --- | --- | --- | --- |
| `/api/auth/register` | POST | Publik | Mendaftarkan Student atau calon Teacher (`multipart/form-data` wajib CV PDF untuk Teacher, konfirmasi kata sandi, bcrypt) |
| `/api/auth/login` | POST | Publik | Login dan menerbitkan cookie sesi JWT |
| `/api/auth/me` | GET | Login | Sinkronisasi data & peran pengguna aktif |
| `/api/courses` | GET | Publik | Katalog course: pencarian, filter, sort, paginasi |
| `/api/enrollments` | POST | Student | Mendaftar ke course *published* yang sudah masuk rentang jadwal |
| `/api/progress/toggle` | POST | Student | Menandai materi selesai secara permanen (transaksi SQL) & menerbitkan sertifikat jika course sudah final |
| `/api/materials/[id]/discussions` | GET, POST | Peserta, Teacher pemilik, Admin | Forum diskusi materi |
| `/api/certificates/[code]` | GET | Publik | Verifikasi sertifikat digital |
| `/api/profile` | PUT | Login | Update profil & foto (multipart/JSON) |
| `/api/teacher-applications` | GET, POST | Student | Riwayat pengajuan & pengajuan ulang (CV PDF wajib) bagi pelamar Teacher yang ditolak |
| `/api/teacher/courses/[id]` | GET, PUT, PATCH, DELETE | Teacher pemilik | Kelola detail course, toggle *draft/published*, finalisasi course (`action: "finalize"`), & hapus course |
| `/api/admin/courses/[id]` | GET, PUT, PATCH, DELETE | Admin | Moderasi, edit, finalisasi (`action: "finalize"`), & hapus course |
| `/api/admin/users` | GET, POST | Admin | Daftar pengguna (pencarian, filter, paginasi) & tambah akun pengguna |
| `/api/uploads/cv/[filename]` | GET | Admin / Pemilik | Mengakses dokumen CV PDF pelamar Teacher secara privat |
| `/api/notifications` | GET | Login | Histori notifikasi pengguna |
| `/api/admin/stats` | GET | Admin | Statistik platform |

---

## 🚀 Panduan Instalasi Lokal

### Prasyarat

- Node.js dan npm
- PostgreSQL yang berjalan lokal atau dapat diakses melalui string koneksi

### 1. Instalasi Dependensi

```bash
npm install
```

### 2. Konfigurasi Variabel Environment

Salin `.env.example` menjadi `.env.local` (atau `.env`) di direktori root, lalu isi nilainya:

```bash
cp .env.example .env.local
# Edit .env.local: isi DATABASE_URL dan JWT_SECRET
```

| Variabel | Deskripsi |
| --- | --- |
| `DATABASE_URL` | String koneksi basis data PostgreSQL |
| `JWT_SECRET` | Kunci rahasia acak (disarankan minimal 32 karakter) untuk JWT HS256 |

> **Catatan:** Pada `src/lib/session.js` terdapat nilai fallback pengembangan jika `JWT_SECRET` belum disetel, namun tetap isi dengan secret yang aman sebelum dijalankan.

### 3. Inisialisasi Basis Data

1. Buat basis data PostgreSQL baru sesuai nama pada `DATABASE_URL`.
2. Jalankan `db/schema.sql` untuk membuat tabel dan indeks.
3. *(Opsional)* Jalankan `db/seed.sql` untuk data demo.

> ⚠️ **Perhatian:** `db/schema.sql` diawali `DROP TABLE IF EXISTS ... CASCADE`, sehingga akan menghapus tabel lama jika dijalankan ulang pada database yang sudah berisi data.

**Akun demo** (kata sandi tercantum di komentar `db/seed.sql`):

| Peran | Email |
| --- | --- |
| Admin | `admin@academyya.id` |
| Teacher | `budi.teacher@academyya.id`, `siti.teacher@academyya.id` |
| Calon Teacher | `rizky.calon@academyya.id` |
| Student | `andi.student@academyya.id`, `ratna.student@academyya.id` |

### 4. Menjalankan Aplikasi

```bash
npm run dev
```

Buka browser di **http://localhost:3000** 🎉

---

## 🧪 Testing & Deployment

| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan Next.js (default `http://localhost:3000`) |
| `npm run lint` | Analisis statik ESLint (`core-web-vitals`) untuk menjaga konvensi kode |
| `npm run build` | Membangun bundel produksi Next.js |
| `npm run start` | Menjalankan server produksi (setelah `npm run build`) |

---

<div align="center">

Didesain dan dikembangkan untuk Universitas Hasanuddin
© 2026 Academyya - Pemrograman Web

</div>