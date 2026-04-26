# 🚀 Panduan Deployment SIGAPPA (VPS & CI/CD)

Dokumen ini menjelaskan cara melakukan pembaruan kode (push) ke VPS agar perubahan tampilan (frontend) dan logika (backend) muncul dengan benar.

## 1. Arsitektur Server (PENTING)
Server menggunakan struktur **"Flattened Public"**:
- **Aplikasi (Laravel):** `/var/www/html/sigappa`
- **Public/Assets (Index.php, Build):** `/var/www/html`
- **Konfigurasi Vite:** `build.outDir` diatur ke `'../build'` agar hasil kompilasi React masuk ke `/var/www/html/build`.

---

## 2. Cara Update Otomatis (GitHub Actions)
Ini adalah cara yang direkomendasikan. Setiap kali kamu melakukan `push` ke branch **`finalisasi`**, server akan otomatis melakukan update.

### Langkah-langkah:
1. Pastikan kamu berada di branch `finalisasi`:
   ```powershell
   git checkout finalisasi
   ```
2. Tambahkan perubahan dan commit:
   ```powershell
   git add .
   git commit -m "Deskripsi perubahan kamu"
   ```
3. Push ke GitHub:
   ```powershell
   git push origin finalisasi
   ```
4. **Tunggu 2-3 menit.** GitHub Actions akan menjalankan script build frontend (`npm run build`) dan optimasi Laravel di server secara otomatis.

---

## 3. Cara Update Manual (Jika GitHub Action Error)
Jika terjadi kendala pada koneksi GitHub ke VPS, gunakan cara manual dari terminal lokal:

### A. Update Backend (PHP)
Gunakan Git Pull langsung di dalam SSH atau kirim file via SCP:
```powershell
# Jalankan di folder project lokal
ssh devel@103.175.204.247 -p 2244 "cd /var/www/html/sigappa && git pull origin finalisasi && php artisan optimize:clear"
```

### B. Update Frontend (React/Vite) - Wajib Jika Tampilan Berubah
Jika kamu merubah file di `resources/js/` atau `resources/css/`, kamu harus build dulu secara lokal baru kirim folder build-nya:
```powershell
# 1. Build secara lokal
npm run build

# 2. Hapus folder build lama di server (jika perlu)
ssh devel@103.175.204.247 -p 2244 "rm -rf /var/www/html/build"

# 3. Kirim folder build ke server (Path harus /var/www/html/)
scp -P 2244 -r ../build devel@103.175.204.247:/var/www/html/
```

---

## 4. Tips Jika Perubahan Tidak Muncul
1. **Hard Refresh:** Tekan `Ctrl + F5` (Windows) atau `Cmd + Shift + R` (Mac) di browser untuk membuang cache lama.
2. **Cek Permission:** Jika error "Permission Denied", jalankan ini di SSH:
   ```bash
   sudo chmod -R 775 /var/www/html/sigappa/storage /var/www/html/sigappa/bootstrap/cache
   ```
3. **Cek Log Deployment:** Buka tab **Actions** di repo GitHub kamu untuk melihat apakah proses `npm run build` di server berhasil atau gagal.

---

## 5. Informasi Akses VPS
- **IP:** `103.175.204.247`
- **Port:** `2244`
- **User:** `devel`
- **Path Utama:** `/var/www/html/sigappa`
