# Panduan Sistem Notifikasi SIGAPPA

Dokumen ini menjelaskan cara kerja sistem notifikasi real-time pada proyek SIGAPPA beserta semua keputusan desain, bug yang pernah ditemukan, dan hal-hal yang perlu diperhatikan saat melakukan perubahan.

---

## Gambaran Umum

Sistem notifikasi berjalan di dua lapisan:

1. **WebSocket (real-time)** — via Laravel Reverb + Laravel Echo (Pusher.js)
2. **HTTP polling (fallback)** — setiap 5 detik jika WebSocket tidak aktif

Dua role yang menerima notifikasi: **admin/superadmin** dan **direktur**. Keduanya menggunakan `AdminLayout` yang merender komponen `NotificationBell`.

---

## Alur Kerja

```
User submit pengajuan
    → status: diproses
    → broadcast(NotificationUpdated)
    → Admin melihat di bell

Admin review → forward ke Direktur
    → status: diajukan, admin_read_at = NULL
    → broadcast(NotificationUpdated)
    → Direktur melihat di bell

Direktur approve/decline/revise
    → status: diterima / ditolak / revisi_direktur
    → admin_read_at = NULL (reset agar Admin dapat notif)
    → broadcast(NotificationUpdated)
    → Admin melihat di bell
```

---

## File-file Kunci

### Backend

| File | Peran |
|------|-------|
| `app/Events/NotificationUpdated.php` | Event yang di-broadcast ke channel `private-notifications` |
| `routes/channels.php` | Otorisasi channel: admin, direktur, superadmin, secret_account |
| `routes/web.php` (prefix `/admin`) | API notifikasi: `/admin/api/notifications`, mark-read, mark-all-read |
| `app/Http/Controllers/Admin/PengajuanController.php` | `updateStatus()` → broadcast saat status berubah; `show()` → mark `admin_read_at` |
| `app/Http/Controllers/Direktur/DirekturController.php` | `approve()`, `decline()`, `revise()` → broadcast + reset `admin_read_at = null` |
| `app/Http/Controllers/User/PengajuanUserController.php` | `store()` dan `storeMasyarakat()` → broadcast saat pengajuan baru |

### Frontend

| File | Peran |
|------|-------|
| `resources/js/echo.ts` | Setup `window.Echo` (Reverb WebSocket client) |
| `resources/js/Components/NotificationBell.tsx` | Komponen bell: polling, Echo listener, badge count |
| `resources/js/Layouts/AdminLayout.tsx` | Merender `NotificationBell` di header (untuk semua role admin + direktur) |

---

## Konfigurasi `.env` yang Wajib Ada

```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=849203
REVERB_APP_KEY=sigap_reverb_key
REVERB_APP_SECRET=sigap_reverb_secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

`QUEUE_CONNECTION` **tidak perlu** `sync` karena event menggunakan `ShouldBroadcastNow` yang bypass queue sepenuhnya.

---

## Cara Menjalankan

Harus ada dua proses berjalan bersamaan:

```bash
# Terminal 1
php artisan serve

# Terminal 2
php artisan reverb:start
```

Tidak perlu `php artisan queue:work` karena `NotificationUpdated` menggunakan `ShouldBroadcastNow`.

---

## Filter Notifikasi per Role

### Admin / Superadmin
Melihat notifikasi untuk status:
```
diproses, direvisi, revisi_direktur, diterima, ditolak, selesai
```

### Direktur
Melihat notifikasi untuk status:
```
diajukan
```
(Hanya pengajuan yang menunggu keputusan direktur)

Ini dikonfigurasi di `routes/web.php` pada route `GET /admin/api/notifications`.

---

## Kolom `admin_read_at` — Aturan Penting

Kolom `admin_read_at` pada tabel `pengajuan` digunakan sebagai indikator "belum dibaca" untuk KEDUA role (admin dan direktur). Reset ke `NULL` artinya ada notifikasi baru.

### Kapan di-set ke `NULL` (reset = ada notif baru):
- `PengajuanController::updateStatus()` — saat admin forward ke direktur (`diajukan`)
- `DirekturController::approve/decline/revise()` — saat direktur memutuskan

### Kapan di-set ke `now()` (dibaca):
- `PengajuanController::show()` — saat detail dibuka, **kecuali**:
  - Admin membuka pengajuan berstatus `diajukan` → **TIDAK** di-set (milik direktur)
  - Direktur membuka pengajuan apapun → selalu di-set
- `/admin/api/notifications/mark-read` — klik notif di bell
- `/admin/api/notifications/mark-all-read` — tandai semua dibaca

### Aturan kritis di `PengajuanController::show()`:
```php
$viewerRole = auth()->user()?->role;
if ($p->admin_read_at === null && ($viewerRole === 'direktur' || $p->status_pengajuan !== Pengajuan::STATUS_DIAJUKAN)) {
    $p->update(['admin_read_at' => now()]);
}
```
**Jangan ubah logika ini.** Tanpa kondisi ini, saat admin redirect kembali ke halaman detail setelah forward ke direktur, `admin_read_at` langsung di-set ke `now()` dan direktur tidak pernah dapat notif.

---

## `NotificationUpdated` Event

```php
// app/Events/NotificationUpdated.php
class NotificationUpdated implements ShouldBroadcastNow
{
    public function broadcastOn(): array {
        return [new PrivateChannel('notifications')];
    }

    public function broadcastAs(): string {
        return 'notification.updated'; // listener di frontend: '.notification.updated'
    }
}
```

**Wajib `ShouldBroadcastNow`**, bukan `ShouldBroadcast`. Perbedaannya:
- `ShouldBroadcast` → masuk queue → butuh `queue:work` agar terproses
- `ShouldBroadcastNow` → langsung kirim ke Reverb dalam request yang sama

Semua pemanggilan `broadcast()` dibungkus `try-catch` agar jika Reverb tidak bisa dicapai, form action tetap berhasil:
```php
try { broadcast(new NotificationUpdated(...)); } catch (\Throwable) {}
```

---

## `NotificationBell.tsx` — Cara Kerja

1. **Mount**: load dari `localStorage` sebagai state awal, lalu langsung fetch ke API
2. **Echo**: subscribe ke `private-notifications`, listen event `.notification.updated`
3. **Polling**: setiap 5 detik (fallback jika WebSocket tidak aktif)
4. **Deteksi notif baru**: membandingkan `id_pengajuan` baru vs `prevIds` yang disimpan di `useRef`
5. **Cleanup**: saat unmount, `Echo.leave('notifications')` dan clear interval

### Catatan penting:
- `AdminLayout` **bukan** persistent layout (tidak menggunakan `Page.layout = ...`)
- Artinya `NotificationBell` unmount/remount setiap navigasi halaman
- Echo subscribe/unsubscribe setiap navigasi — ini normal dan bekerja dengan benar

---

## Troubleshooting

### Notif tidak muncul sama sekali

1. Cek apakah `BROADCAST_CONNECTION=reverb` ada di `.env`
2. Cek apakah `php artisan reverb:start` sedang berjalan
3. Buka DevTools browser → Console → cari `[NotificationBell] channel auth error`
   - Jika ada error: channel auth gagal → cek `routes/channels.php` dan sesi login user
4. Buka DevTools → Network → filter WS → cek apakah ada koneksi WebSocket ke `localhost:8080`
5. Jalankan `php artisan config:clear` dan `php artisan cache:clear`

### Notif admin muncul tapi direktur tidak (atau sebaliknya)

- Pastikan `admin_read_at` belum di-set untuk item yang relevan
- Cek filter status di `routes/web.php` route `GET /admin/api/notifications`
- Direktur hanya melihat `diajukan`; admin melihat `diproses`, `direvisi`, `revisi_direktur`, `diterima`, `ditolak`, `selesai`

### Form submit direktur gagal (approve/decline/revise)

- `DirekturController` memvalidasi `catatan` minimum 5 karakter
- Pastikan pengajuan masih berstatus `diajukan` (sudah diproses tidak bisa di-act lagi)
- Cek error di browser Console — ada `onError` handler di `Detail.tsx` yang menampilkan pesan validasi

### Notif muncul terlambat

- Polling berjalan setiap 5 detik — notif akan muncul dalam 5 detik tanpa WebSocket
- Jika WebSocket aktif, notif muncul dalam ~500ms setelah aksi

---

## Yang Tidak Perlu Diubah

- `routes/channels.php` — sudah benar, jangan ubah logika otorisasi role
- `ShouldBroadcastNow` di `NotificationUpdated` — sudah sengaja, jangan ganti ke `ShouldBroadcast`
- Kondisi `admin_read_at` di `PengajuanController::show()` — kritis, jangan simplifikasi
- Interval polling 5 detik — jangan naikkan ke 60 detik lagi
