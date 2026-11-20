# Academyya LMS

**Academyya: Learn Skills. Build Your Future.** adalah aplikasi *Learning Management System* (LMS) berbasis web yang dibangun dengan **Next.js (App Router)** dan **PostgreSQL** (`pg`, *raw SQL* terparameter tanpa ORM). Aplikasi ini mendukung pembelajaran terstruktur untuk tiga peran pengguna (**Student**, **Teacher**, dan **Admin**) lengkap dengan pelacakan progres materi, forum diskusi, notifikasi *in-app*, serta penerbitan dan verifikasi sertifikat digital.

> Identitas paket pada `package.json`: `pertemuan-8` (`v0.1.0`).

---

## Fitur Utama

### 1. Halaman Publik & Eksplorasi Katalog
- **Beranda (`/`):** Menampilkan ringkasan statistik platform (`total_courses`, `total_students`, `total_teachers`), hingga 4 course terpopuler, panduan 4 langkah cara belajar, FAQ interaktif (`FaqSection`), *Hero Section* berlapis (`HeroVisual` dengan animasi CSS GPU dan dukungan `prefers-reduced-motion`), serta banner kontekstual (*Lanjutkan Belajarmu* untuk Student atau ajakan menjadi Teacher).
- **Katalog Course (`/courses`):** Pencarian berdasarkan judul/deskripsi, filter kategori dan level (`pemula`, `menengah`, `lanjut`), pengurutan (*Terbaru* / *Terpopuler*), dan paginasi (12 item per halaman) yang tersinkron ke parameter URL melalui `GET /api/courses`.
- **Detail Course (`/courses/[slug]`):** Menampilkan informasi pengajar, metrik jumlah materi dan total durasi, silabus berurutan, serta status pendaftaran. Course berstatus `draft` hanya dapat diakses oleh pengajar pemiliknya atau Admin.

### 2. Autentikasi & Otorisasi Berbasis Peran (RBAC)
- **Registrasi & Login:** Pendaftaran sebagai **Student** atau calon **Teacher** (`POST /api/auth/register`), serta login/logout (`POST /api/auth/login`, `POST /api/auth/logout`) dengan hash kata sandi `bcryptjs` (cost factor 10).
- **Sesi JWT Cookie:** Menggunakan token JWT `HS256` (`jose`) berdurasi 7 hari yang disimpan pada HTTP-only cookie `academyya_session`.
- **Sinkronisasi Peran & Guard Bertingkat:** `src/middleware.js` memeriksa keabsahan cookie sesi untuk rute terproteksi (`/certificates`, `/dashboard`, `/learn`, `/profile`, `/teacher`, `/admin`), sementara pengecekan peran database dijalankan oleh Server Component layout/halaman (`getCurrentUser()`) serta API guards (`requireApiAuth`, `requireApiRole`), dan disinkronkan melalui `GET /api/auth/me`.

### 3. Ruang Belajar, Progres & Diskusi Materi
- **Enrollment & Ruang Belajar (`/learn/[course]/[materi]`):** Siswa berperan `student` dapat mendaftar ke course `published` (`POST /api/enrollments`). Ruang belajar menyediakan navigasi materi sebelumnya/berikutnya, pemutar video embed YouTube/Vimeo (`toEmbedVideoUrl`), konten teks multi-paragraf, serta mode pratinjau bagi pengajar pemilik dan Admin.
- **Pelacakan Progres (`Mark as Done`):** Menandai atau membatalkan status selesai materi dalam transaksi SQL (`POST /api/progress/toggle`) sekaligus menghitung ulang persentase penyelesaian secara dinamis.
- **Forum Diskusi Materi:** Tanya-jawab khusus peserta terdaftar, pengajar pemilik course, dan Admin (`GET`/`POST /api/materials/[id]/discussions`) dengan struktur pertanyaan induk dan balasan satu tingkat (`parent_id`).

### 4. Sertifikat Digital & Cetak PDF
- **Penerbitan Otomatis:** Saat progres mencapai 100%, transaksi SQL memperbarui status enrollment menjadi `completed` dan menerbitkan kode verifikasi unik berformat `ACAD-YYYY-XXXXXX`.
- **Daftar & Verifikasi Publik:** Siswa dapat melihat koleksinya di `/certificates`, sedangkan publik maupun API (`GET /api/certificates/[code]`) dapat memverifikasi dan mencetak sertifikat di `/certificates/[code]` dengan tata letak cetak A4 lanskap (`297mm x 209.5mm`).

### 5. Profil, Pengajuan Teacher, Notifikasi & Storage Lokal
- **Pengaturan Profil (`/profile`):** Pembaruan nama, bio, kata sandi, dan foto profil (`PUT /api/profile` via `multipart/form-data` atau JSON).
- **Pengajuan Teacher & Notifikasi:** Student dapat mengajukan atau mengajukan ulang peran Teacher (`/api/teacher-applications`) dan memantau notifikasi melalui ikon lonceng pada `Navbar` (`/api/notifications`, `/api/notifications/read`).
- **Penyimpanan Gambar Lokal:** Avatar (maks 2 MB) disimpan di `storage/uploads/avatars/` dan sampul course (maks 5 MB) di `storage/uploads/courses/` setelah validasi *magic bytes* (JPEG/PNG/WebP, menolak SVG), lalu disajikan melalui `/api/uploads/avatars/[filename]` dan `/api/uploads/courses/[filename]`.

### 6. Panel Pengajar (`/teacher`) & Panel Admin (`/admin`)
- **Teacher Panel:** Ringkasan metrik mengajar, pembuatan dan penyuntingan course beserta upload foto sampul `FormData`, toggle `published`/`draft` (syarat minimal 1 materi), manajemen materi CRUD dan pengurutan ulang atomik (memanfaatkan constraint `DEFERRABLE INITIALLY DEFERRED`), serta pemantauan progres siswa (`/teacher/students`).
- **Admin Panel:** Statistik platform (`GET /api/admin/stats`), peninjauan pengajuan Teacher (`approve`/`reject` dengan promosi peran dan notifikasi transaksional), CRUD kategori (dilindungi `ON DELETE RESTRICT`), moderasi status/materi/hapus course, serta pengelolaan akun pengguna (mencegah penghapusan akun sendiri).

### 7. Aksesibilitas & UI
- Pengaturan ukuran teks dinamis **A− / A+** (`Normal` 100%, `Besar` 112.5%, `Ekstra Besar` 125%) yang tersimpan di `localStorage` (`FontSizeContext` & `FontSizeControl`).
- Dukungan `@media (prefers-reduced-motion: reduce)`, navigasi `:focus-visible`, sistem toast notifikasi (`ToastContext`), serta `Modal` / `ConfirmModal` dengan penutupan via tombol `Escape` maupun backdrop.

> **Catatan Basis Data:** Skema [`db/schema.sql`](db/schema.sql) turut mendefinisikan tabel `reviews` dan `bookmarks`, namun kedua tabel tersebut belum digunakan oleh fitur atau API mana pun pada direktori `src/`.

---

## Tech Stack

Sesuai [`package.json`](package.json), [`next.config.mjs`](next.config.mjs), [`eslint.config.mjs`](eslint.config.mjs), dan [`jsconfig.json`](jsconfig.json):

| Kategori | Teknologi | Versi / Keterangan |
| :--- | :--- | :--- |
| Framework | Next.js (App Router) | `16.4.6` (Turbopack CSS loader via `@tailwindcss/turbopack`) |
| UI Library | React & React DOM | `19.3.0` |
| Styling | Tailwind CSS & `@tailwindcss/turbopack` | `4.3.3` |
| Basis Data | PostgreSQL (`pg`) | `^8.23.1` (*Raw SQL* terparameter, connection pool maks 20) |
| Keamanan & Sesi | `jose` & `bcryptjs` | `^6.2.17` (JWT HS256) & `^3.0.3` (password hashing) |
| Ikon | `lucide-react` | `^1.73.0` |
| Linter | ESLint & `eslint-config-next` | `^9` & `16.4.6` (`core-web-vitals`) |
| Path Alias | `jsconfig.json` | `@/*` mengarah ke `./src/*` |

---

## Struktur Folder Proyek

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
│   ├── middleware.js               # Guard sesi JWT Edge-safe & redirect halaman auth
│   ├── app/
│   │   ├── globals.css             # Token @theme Tailwind v4, animasi Hero, aturan print A4
│   │   ├── layout.js               # Root layout (Poppins, Inter, FontSizeProvider, ToastProvider)
│   │   ├── (public)/               # Rute publik: /, /courses, /courses/[slug], /certificates/[code], /login, /register
│   │   ├── (student)/              # Rute pengguna login: /dashboard, /certificates, /profile, /learn/[course]/[materi]
│   │   ├── (teacher)/teacher/      # Teacher Panel: ringkasan, kelola course, materi, progres siswa
│   │   ├── (admin)/admin/          # Admin Panel: statistik, verifikasi teacher, kategori, moderasi course, pengguna
│   │   └── api/                    # 30 Route Handler API (auth, courses, enrollments, progress, discussions, teacher, admin, uploads)
│   ├── components/                 # Komponen UI per domain (admin, auth, course, home, layout, learning, student, teacher, ui)
│   └── lib/                        # Helper inti (db, auth, session, validators, uploadStorage, avatarStorage, courseThumbnailStorage, queries/*)
├── storage/                        # Direktori penyimpanan unggahan runtime (diabaikan di .gitignore)
├── .env.example                    # Contoh daftar nama variabel environment
├── eslint.config.mjs               # Konfigurasi ESLint
├── jsconfig.json                   # Alias path @/*
├── next.config.mjs                 # Konfigurasi Next.js (Turbopack CSS)
└── package.json                    # Daftar dependensi dan script NPM
```

---

## Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- **Node.js** dan **npm**
- **PostgreSQL** yang berjalan secara lokal atau dapat diakses melalui string koneksi

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Variabel Environment
Salin berkas `.env.example` menjadi `.env.local` (atau `.env`) di direktori root proyek, lalu isi nilai sesuai lingkungan lokal Anda:

- `DATABASE_URL`: String koneksi basis data PostgreSQL.
- `JWT_SECRET`: Kunci rahasia acak (disarankan minimal 32 karakter) untuk penandatanganan JWT HS256. *(Catatan: pada `src/lib/session.js` terdapat nilai fallback pengembangan jika belum disetel, namun tetap isi dengan secret aman sebelum dijalankan).*

### 4. Inisialisasi Basis Data PostgreSQL
1. Buat basis data PostgreSQL baru sesuai nama database pada `DATABASE_URL` Anda.
2. Jalankan skrip [`db/schema.sql`](db/schema.sql) pada basis data tersebut untuk membuat tabel dan indeks.
   > **Perhatian:** `db/schema.sql` diawali dengan perintah `DROP TABLE IF EXISTS ... CASCADE`, sehingga akan menghapus tabel lama jika dijalankan ulang pada database yang sudah berisi data.
3. *(Opsional)* Jalankan [`db/seed.sql`](db/seed.sql) untuk mengisi data awal demo (kategori, course, materi, serta contoh akun `admin@academyya.id`, `budi.teacher@academyya.id`, `siti.teacher@academyya.id`, `rizky.calon@academyya.id`, `andi.student@academyya.id`, dan `ratna.student@academyya.id` dengan kata sandi demo yang tercantum di komentar `db/seed.sql`).

### 5. Perintah yang Tersedia (`package.json`)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan Next.js (default di `http://localhost:3000`) |
| `npm run lint` | Menjalankan pemeriksaan ESLint pada proyek |
| `npm run build` | Membangun bundel produksi Next.js |
| `npm run start` | Menjalankan server produksi Next.js (setelah `npm run build`) |
