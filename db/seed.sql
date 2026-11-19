-- Academyya LMS Initial Seed Data
-- Demo password for ALL seeded accounts: "Password123!"
-- Verified bcryptjs ($2b$10$) hash for "Password123!":
-- $2b$10$Oqh5RppRHD75Iq2a3XzZ8.DHgo9JRPexaRYMIqIaQxkJdG8TUOA.G

INSERT INTO users (id, name, email, password_hash, role, bio) VALUES
  (1, 'Admin Academyya', 'admin@academyya.id', '$2b$10$Oqh5RppRHD75Iq2a3XzZ8.DHgo9JRPexaRYMIqIaQxkJdG8TUOA.G', 'admin', 'Administrator utama platform Academyya.'),
  (2, 'Budi Santoso, M.Kom.', 'budi.teacher@academyya.id', '$2b$10$Oqh5RppRHD75Iq2a3XzZ8.DHgo9JRPexaRYMIqIaQxkJdG8TUOA.G', 'teacher', 'Praktisi Fullstack Web Developer dengan 10 tahun pengalaman mengajar pemula hingga mahir.'),
  (3, 'Siti Rahmawati, S.Ds.', 'siti.teacher@academyya.id', '$2b$10$Oqh5RppRHD75Iq2a3XzZ8.DHgo9JRPexaRYMIqIaQxkJdG8TUOA.G', 'teacher', 'Product Designer dan UI/UX Educator yang fokus pada desain inklusif untuk semua usia.'),
  (4, 'Rizky Pratama', 'rizky.calon@academyya.id', '$2b$10$Oqh5RppRHD75Iq2a3XzZ8.DHgo9JRPexaRYMIqIaQxkJdG8TUOA.G', 'student', 'Analis data yang sedang mengajukan diri menjadi instruktur.'),
  (5, 'Andi Wijaya', 'andi.student@academyya.id', '$2b$10$Oqh5RppRHD75Iq2a3XzZ8.DHgo9JRPexaRYMIqIaQxkJdG8TUOA.G', 'student', 'Mahasiswa semester akhir yang antusias belajar web development dan desain.'),
  (6, 'Ibu Ratna Kusuma', 'ratna.student@academyya.id', '$2b$10$Oqh5RppRHD75Iq2a3XzZ8.DHgo9JRPexaRYMIqIaQxkJdG8TUOA.G', 'student', 'Pensiunan guru yang senang mempelajari keterampilan digital baru.');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO teacher_applications (id, user_id, expertise, motivation, portfolio_url, status, reviewed_by, review_note, reviewed_at) VALUES
  (1, 2, 'Pemrograman Web & Database', 'Ingin berbagi ilmu pembuatan aplikasi web modern secara terstruktur.', 'https://github.com/budisantoso-dev', 'approved', 1, 'Profil dan portofolio terverifikasi.', NOW() - INTERVAL '10 days'),
  (2, 3, 'Desain UI/UX & Aksesibilitas', 'Membantu pemula memahami desain antarmuka yang ramah pengguna.', 'https://dribbble.com/sitirahma', 'approved', 1, 'Disetujui sebagai pengajar kategori Desain.', NOW() - INTERVAL '8 days'),
  (3, 4, 'Analisis Data & Spreadsheet', 'Berpengalaman 5 tahun mengolah data bisnis dan ingin membuat kelas pemula.', 'https://linkedin.com/in/rizkypratama', 'pending', NULL, NULL, NULL);

SELECT setval('teacher_applications_id_seq', (SELECT MAX(id) FROM teacher_applications));

INSERT INTO categories (id, name, slug, description, icon) VALUES
  (1, 'Teknologi & Pemrograman', 'teknologi-pemrograman', 'Pelajari dasar pemrograman web, basis data, dan pengembangan aplikasi modern.', 'Code'),
  (2, 'Desain UI/UX', 'desain-ui-ux', 'Rancang antarmuka digital yang indah, mudah digunakan, dan inklusif.', 'Palette'),
  (3, 'Bisnis & Produktivitas', 'bisnis-produktivitas', 'Tingkatkan keterampilan manajemen waktu, komunikasi kerja, dan kewirausahaan.', 'Briefcase'),
  (4, 'Literasi Digital', 'literasi-digital', 'Panduan praktis keamanan internet dan penggunaan perangkat digital untuk semua usia.', 'ShieldCheck'),
  (5, 'Bahasa & Komunikasi', 'bahasa-komunikasi', 'Kuasai bahasa asing dan teknik presentasi yang percaya diri.', 'Languages');

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

INSERT INTO courses (id, teacher_id, category_id, title, slug, description, thumbnail_url, level, status) VALUES
  (1, 2, 1, 'Dasar Pemrograman Web Modern dengan HTML, CSS & JavaScript', 'dasar-pemrograman-web-modern', 'Pelajari fondasi membangun website interaktif dari nol dengan penjelasan langkah demi langkah yang mudah dipahami pemula.', '/images/courses/dasar-pemrograman-web-modern.jpg', 'pemula', 'published'),
  (2, 2, 1, 'Menguasai PostgreSQL & Raw SQL untuk Aplikasi Web', 'menguasai-postgresql-raw-sql', 'Pahami perancangan tabel relasional, normalisasi 3NF, indeks, dan query SQL terparameter yang aman dan cepat.', '/images/courses/menguasai-postgresql-raw-sql.jpg', 'menengah', 'published'),
  (3, 3, 2, 'Prinsip Desain UI/UX Ramah Semua Usia', 'prinsip-desain-ui-ux-ramah-semua-usia', 'Belajar menyusun tipografi, kontras warna WCAG, dan tata letak kartu yang nyaman diakses anak muda hingga lansia.', '/images/courses/prinsip-desain-ui-ux-ramah-semua-usia.jpg', 'pemula', 'published'),
  (4, 3, 2, 'Membangun Design System dengan Tailwind CSS', 'membangun-design-system-tailwind-css', 'Terapkan token warna, skala tipografi, dan komponen UI modular menggunakan Tailwind CSS.', '/images/courses/membangun-design-system-tailwind-css.jpg', 'menengah', 'published'),
  (5, 2, 4, 'Keamanan Digital & Anti Penipuan Online untuk Pemula', 'keamanan-digital-anti-penipuan-online', 'Panduan praktis menjaga keamanan akun, kata sandi, dan transaksi digital sehari-hari.', '/images/courses/keamanan-digital-anti-penipuan-online.jpg', 'pemula', 'published'),
  (6, 3, 3, 'Manajemen Waktu & Komunikasi Efektif di Dunia Kerja', 'manajemen-waktu-komunikasi-efektif', 'Susun prioritas tugas harian, catat rapat secara ringkas, dan bangun komunikasi tim yang jelas dan produktif.', '/images/courses/manajemen-waktu-komunikasi-efektif.jpg', 'lanjut', 'published');

SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

INSERT INTO materials (id, course_id, title, content, video_url, position, duration_minutes) VALUES
  -- Course 1 (5 materials -> Andi completes 2 = 40%)
  (1, 1, 'Pengenalan Cara Kerja Website', 'Pada materi pertama ini, kita akan memahami bagaimana browser dan server saling berkomunikasi menggunakan HTTP, serta peran HTML, CSS, dan JavaScript dalam membentuk halaman web.', 'https://www.youtube.com/embed/qz0aGYrrlhU', 1, 12),
  (2, 1, 'Struktur Dokumen HTML Semantik', 'HTML semantik membantu pembaca layar (screen reader) dan mesin pencari memahami struktur konten halaman seperti header, main, article, dan footer.', 'https://www.youtube.com/embed/kUMe1FH4CHE', 2, 18),
  (3, 1, 'Styling Tata Letak Responsif dengan CSS', 'Pelajari konsep box model, Flexbox, dan CSS Grid agar tampilan halaman tetap rapi di layar ponsel maupun desktop.', NULL, 3, 20),
  (4, 1, 'Dasar Interaktivitas dengan JavaScript', 'Mengenal variabel, fungsi, event listener, dan manipulasi DOM untuk membuat tombol dan formulir menjadi interaktif.', NULL, 4, 25),
  (5, 1, 'Proyek Mini: Halaman Portofolio Responsif', 'Gabungkan struktur HTML semantik, CSS Grid, dan JavaScript dasar untuk membangun halaman portofolio sederhana yang nyaman diakses di perangkat seluler.', NULL, 5, 25),

  -- Course 2 (4 materials)
  (6, 2, 'Konsep Basis Data Relasional & Normalisasi', 'Memahami primary key, foreign key, dan aturan bentuk normal ketiga (3NF) agar data bebas duplikasi.', NULL, 1, 15),
  (7, 2, 'Menulis Query SELECT, JOIN, dan Agregasi', 'Praktik menggabungkan tabel menggunakan INNER JOIN dan LEFT JOIN serta menghitung persentase progres dengan COUNT dan FILTER.', NULL, 2, 22),
  (8, 2, 'Keamanan Query Terparameter & Transaksi ACID', 'Mengapa penggabungan string SQL berbahaya dan bagaimana placeholder $1, $2 serta blok BEGIN/COMMIT menjaga integritas data.', NULL, 3, 20),
  (9, 2, 'Optimasi Indeks & Penanganan Error SQLSTATE', 'Menggunakan CREATE INDEX secara tepat guna serta memetakan kode error PostgreSQL seperti 23505 dan 23503 menjadi pesan yang jelas.', NULL, 4, 18),

  -- Course 3 (4 materials)
  (10, 3, 'Mengenal Universal Design & Aksesibilitas', 'Desain yang baik dapat digunakan oleh semua kelompok usia tanpa hambatan penglihatan maupun motorik.', NULL, 1, 14),
  (11, 3, 'Memilih Kontras Warna & Ukuran Tipografi', 'Aturan rasio kontras minimal 4.5:1, ukuran teks minimal 16px, dan target sentuh tombol minimal 44x44px.', NULL, 2, 16),
  (12, 3, 'Menyusun Hierarki Visual dengan Card UI', 'Cara mengelompokkan informasi penting agar mudah dipindai dalam hitungan detik.', NULL, 3, 15),
  (13, 3, 'Navigasi Keyboard & Pengujian Pembaca Layar', 'Pastikan alur Tab logis, fokus terlihat jelas, dan setiap kontrol memiliki label yang dapat dibaca teknologi bantu.', NULL, 4, 18),

  -- Course 4 (4 materials)
  (14, 4, 'Konfigurasi Token Warna & Font di Tailwind CSS', 'Menggunakan blok @theme pada Tailwind CSS v4 untuk konsistensi warna primer, aksen, dan tipografi.', NULL, 1, 15),
  (15, 4, 'Membangun Komponen Tombol & Formulir Konsisten', 'Menentukan varian tombol, ukuran target sentuh minimum, dan pesan error validasi yang konsisten di seluruh aplikasi.', NULL, 2, 18),
  (16, 4, 'Pola Tata Letak Grid Responsif Tanpa Overflow', 'Mengatur kolom yang menyesuaikan lebar layar dari 360px hingga desktop lebar tanpa pergeseran horizontal.', NULL, 3, 20),
  (17, 4, 'Membuat Tabel Data yang Berubah Menjadi Kartu di Ponsel', 'Strategi menyajikan informasi tabular di desktop sekaligus nyaman dibaca di layar sempit.', NULL, 4, 16),

  -- Course 5 (4 materials)
  (18, 5, 'Membuat Kata Sandi Kuat & Mengenal Phishing', 'Langkah sederhana mengenali tautan palsu dan mengamankan akun email serta perbankan.', NULL, 1, 12),
  (19, 5, 'Mengaktifkan Verifikasi Dua Langkah (2FA)', 'Cara kerja kode OTP dan aplikasi autentikator untuk melindungi akun meski kata sandi bocor.', NULL, 2, 14),
  (20, 5, 'Mengenali Modus Penipuan Pesan & File APK Berbahaya', 'Tanda-tanda umum rekayasa sosial lewat pesan singkat dan cara memverifikasi pengirim resmi.', NULL, 3, 16),
  (21, 5, 'Keamanan Wi-Fi Publik & Privasi Data Pribadi', 'Kebiasaan aman saat memakai jaringan umum serta membatasi informasi sensitif di media sosial.', NULL, 4, 14),

  -- Course 6 (4 materials)
  (22, 6, 'Menentukan Prioritas dengan Matriks Mendesak-Penting', 'Memisahkan pekerjaan yang berdampak jangka panjang dari gangguan harian agar energi kerja tidak terbuang.', NULL, 1, 15),
  (23, 6, 'Teknik Time Blocking untuk Fokus Mendalam', 'Menjadwalkan blok waktu kerja terstruktur dengan jeda istirahat yang realistis sepanjang pekan.', NULL, 2, 18),
  (24, 6, 'Menulis Pesan Kerja Asinkron yang Ringkas & Jelas', 'Struktur pembaruan progres yang langsung menyebut konteks, keputusan, dan tindak lanjut.', NULL, 3, 16),
  (25, 6, 'Mengelola Rapat Tim agar Singkat & Menghasilkan Keputusan', 'Menyiapkan agenda sebelum rapat dimulai dan merangkum daftar tugas dengan penanggung jawab yang jelas.', NULL, 4, 18);

SELECT setval('materials_id_seq', (SELECT MAX(id) FROM materials));

INSERT INTO enrollments (id, student_id, course_id, status, enrolled_at) VALUES
  (1, 5, 1, 'active', NOW() - INTERVAL '3 days'),
  (2, 6, 3, 'active', NOW() - INTERVAL '2 days');

SELECT setval('enrollments_id_seq', (SELECT MAX(id) FROM enrollments));

INSERT INTO material_progress (enrollment_id, material_id, is_completed, completed_at) VALUES
  (1, 1, TRUE, NOW() - INTERVAL '2 days'),
  (1, 2, TRUE, NOW() - INTERVAL '1 day'),
  (2, 10, TRUE, NOW() - INTERVAL '1 day');

INSERT INTO discussions (id, material_id, user_id, parent_id, content, created_at) VALUES
  (1, 2, 5, NULL, 'Halo Pak Budi, kapan sebaiknya kita menggunakan tag <section> dibandingkan <div> biasa?', NOW() - INTERVAL '1 day'),
  (2, 2, 2, 1, 'Pertanyaan bagus Andi! Gunakan <section> ketika blok konten tersebut memiliki topik tersendiri dan idealnya memiliki heading (H2/H3). Gunakan <div> murni untuk pembungkus tata letak/styling.', NOW() - INTERVAL '20 hours');

SELECT setval('discussions_id_seq', (SELECT MAX(id) FROM discussions));

INSERT INTO notifications (user_id, title, message, is_read) VALUES
  (4, 'Pengajuan Teacher Diterima Sistem', 'Terima kasih telah mendaftar sebagai Teacher. Pengajuan Anda sedang ditinjau oleh Admin.', FALSE);
