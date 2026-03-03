# Dokumentasi Proyek Untuk Client

## 1. Ringkasan Proyek
**Nama Aplikasi:** Absensi - Sistem Absensi Siswa  
**Jenis Aplikasi:** Progressive Web App (PWA), mobile-first  
**Tujuan:** Mempermudah guru mencatat kehadiran siswa per kelas secara cepat, rapi, dan terdokumentasi.

Aplikasi ini dirancang untuk penggunaan operasional harian sekolah, terutama saat absensi kelas berlangsung.

---

## 2. Ruang Lingkup Fitur (Yang Sudah Tersedia)

### A. Login & Role
- Login berbasis **Nama Panjang + Email**.
- Role dibedakan menjadi:
  - **Admin**
  - **User (Guru)**

### B. Fitur User (Guru)
- Melihat daftar kelas.
- Mengisi absensi siswa per kelas per tanggal.
- Mengubah status absensi pada hari yang sama.
- Melihat rekap absensi.

### C. Fitur Admin
- Semua akses user.
- Kelola data kelas:
  - Tambah kelas
  - Edit kelas
  - Hapus kelas
- Kelola data siswa:
  - Tambah siswa
  - Edit siswa
  - Hapus siswa
- Import siswa via CSV/Excel.
- Download backup data JSON.

### D. Rekap & Laporan
- Rekap absensi dengan filter tanggal dan kelas.
- Ringkasan status: Hadir, Izin, Sakit, Alpha.
- Rekap per siswa (mingguan/bulanan).
- Export CSV.

### E. Audit Trail (Backend)
- Sistem mencatat aktivitas penting, seperti:
  - Login / logout
  - Tambah/edit/hapus kelas
  - Tambah/edit/hapus/import siswa
  - Submit absensi
  - Export backup
- Catatan audit tersedia untuk kebutuhan monitoring dan penelusuran aktivitas.

---

## 3. Akses Default

### Admin
- **Nama:** `Admin`
- **Email:** `admin@smktarkid.id`

### User (Guru)
- **Email default:** `guru@smktarkid.id`
- **Nama:** isi nama panjang guru (minimal 2 kata)

---

## 4. Alur Penggunaan Harian
1. Guru login ke aplikasi.
2. Pilih kelas yang akan diabsen.
3. Pilih tanggal absensi.
4. Tandai semua siswa (Hadir/Izin/Sakit/Alpha).
5. Simpan absensi.
6. Lihat rekap jika diperlukan.

Catatan penting:
- Absensi tidak bisa disimpan jika belum lengkap untuk semua siswa di kelas.

---

## 5. Informasi Deploy
- **Domain utama (production):** `https://absen-eight-theta.vercel.app`
- **Platform hosting:** Vercel
- **Database:** Neon PostgreSQL

---

## 6. Kebutuhan Sistem
- Browser modern (Chrome, Edge, Safari, Firefox).
- Koneksi internet untuk sinkronisasi data.
- Bisa dipasang sebagai PWA di mobile untuk akses cepat.

---

## 7. Batasan Versi Saat Ini
- Belum menggunakan autentikasi password/OTP.
- Audit trail saat ini disiapkan di backend (untuk konsumsi admin/teknis).
- Restore backup otomatis dari file JSON belum disediakan.

---

## 8. Checklist UAT (Client)
- [ ] Login admin dan user berjalan.
- [ ] Admin bisa tambah/edit/hapus kelas.
- [ ] Admin bisa tambah/edit/hapus siswa.
- [ ] Import siswa CSV/Excel berhasil.
- [ ] Guru bisa mengisi absensi lengkap dan menyimpan.
- [ ] Rekap dan export CSV berjalan.
- [ ] Backup JSON bisa diunduh.

---

## 9. Catatan Serah Terima
Dokumen ini menggambarkan kondisi fitur aplikasi saat ini untuk kebutuhan operasional sekolah. Perubahan lanjutan (fitur tambahan, penguatan keamanan, dashboard analitik) dapat dijadwalkan pada fase berikutnya.
