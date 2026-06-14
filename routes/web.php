<?php

use App\Http\Controllers\Admin\AktivitasController;
use App\Http\Controllers\Admin\ArsipController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EvaluasiSistemController;
use App\Http\Controllers\Admin\HistorisController;
use App\Http\Controllers\Admin\KontakController;
use App\Http\Controllers\Admin\MailTestController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PegawaiController;
use App\Http\Controllers\Admin\PengajuanController;
use App\Http\Controllers\Admin\SearchController;
use App\Http\Controllers\Admin\TemplateDokumenController;
use App\Http\Controllers\Admin\TestimoniController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\GeocodeController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Direktur\DirekturController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Secret\AppreciationController;
use App\Http\Controllers\Secret\SiteSettingController;
use App\Http\Controllers\User\PengajuanUserController;
use App\Models\Aktivitas;
use App\Models\DeveloperAppreciation;
use App\Models\DeveloperDocumentation;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\TemplateDokumen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

// ─────────────────────────────────────────────
// Welcome & Public routes
// ─────────────────────────────────────────────
Route::get('/', [LandingController::class, 'welcome'])->name('welcome');
Route::get('/beranda', [LandingController::class, 'index'])->name('beranda');

// Panduan page
Route::get('/panduan', [LandingController::class, 'panduan'])->name('panduan');

// Testimoni publik (Umum)
Route::post('/testimoni/public', [LandingController::class, 'storePublicTestimoni'])->middleware('throttle:10,1')->name('testimoni.public.store');

// Evaluasi Sistem (Umum)
Route::get('/evaluasi', [LandingController::class, 'showEvaluasi'])->name('evaluasi.index');
Route::post('/evaluasi-sistem', [LandingController::class, 'storeEvaluasiSistem'])->middleware('throttle:60,1')->name('evaluasi.store');

// Developer Crew
Route::get('/developer-crew', [LandingController::class, 'developerCrew']);

// Geocode proxy — Rate limited 30 req/menit per IP
Route::get('/api/geocode', [GeocodeController::class, 'search'])->middleware('throttle:30,1')->name('api.geocode');

// Reverse geocode — lat/lng → address
Route::get('/api/reverse-geocode', [GeocodeController::class, 'reverse'])->middleware('throttle:30,1')->name('api.reverse-geocode');

// ─────────────────────────────────────────────
// Pengumpulan Arsip Publik
// ─────────────────────────────────────────────
Route::get('/kumpul-arsip', [LandingController::class, 'showArsipKumpulIndex'])->name('arsip.kumpul.index');

Route::get('/kumpul-arsip/{kode}', [LandingController::class, 'showArsipKumpul'])->name('arsip.kumpul.public');
Route::post('/kumpul-arsip/{kode}', [LandingController::class, 'storeArsipKumpul'])->middleware('throttle:10,1')->name('arsip.kumpul.public.store');

// ─────────────────────────────────────────────
// Pengisian Testimoni Publik
// ─────────────────────────────────────────────
Route::get('/testimoni', [LandingController::class, 'showTestimoniIndex'])->name('testimoni.index');

Route::get('/testimoni/{kode}', [LandingController::class, 'showTestimoni'])->name('testimoni.public');
Route::post('/testimoni/{kode}', [LandingController::class, 'storeTestimoni'])->middleware('throttle:10,1')->name('testimoni.public.store_activity');

// ─────────────────────────────────────────────
// Guest & Auth Management routes
// ─────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
    Route::post('/check-nip', [AuthController::class, 'checkNip'])->name('check-nip');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');

    // Specialized login pages
    Route::get('/login/dosen', [AuthController::class, 'showLoginDosen'])->name('login.dosen');
    Route::get('/login/masyarakat', [AuthController::class, 'showLoginMasyarakat'])->name('login.masyarakat');

    Route::get('/verify-email', [AuthController::class, 'verifyEmail'])->name('verification.notice');
});

// Public Template Downloader (Accessible for guests and authenticated users)
Route::get('/template/{jenis}', [TemplateDokumenController::class, 'downloadTemplate'])->name('template.download');

// User Pages (Pengajuan & Status) - require authentication
Route::get('/pengajuan', [PengajuanUserController::class, 'index'])->middleware('auth')->name('pengajuan.form');
Route::get('/cek-status', [PengajuanUserController::class, 'index'])->middleware('auth')->name('pengajuan.status');

// ─────────────────────────────────────────────
// Authenticated routes
// ─────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Profile edit (all roles)
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile/edit', [ProfileController::class, 'update'])->name('profile.update');

    // User: submit/update pengajuan
    Route::post('/pengajuan', [PengajuanUserController::class, 'store'])->name('pengajuan.store');
    Route::put('/pengajuan/{kode}', [PengajuanUserController::class, 'update'])->name('pengajuan.update');
    Route::post('/pengajuan/{kode}/resubmit', [PengajuanUserController::class, 'resubmit'])->name('pengajuan.resubmit');

    // Pegawai names for autocomplete recommendations
    Route::get('/api/pegawai-options', [PegawaiController::class, 'options'])->name('api.pegawai-options');

    // ─────────────────────────────────────────
    // Direktur routes
    // ─────────────────────────────────────────
    Route::prefix('direktur')->name('direktur.')->middleware('direktur')->group(function () {
        Route::redirect('/', '/direktur/dashboard');
        Route::get('/dashboard', [DirekturController::class, 'index'])->name('dashboard');
        Route::get('/pengajuan/{id}', [DirekturController::class, 'show'])->name('pengajuan.show');
        Route::post('/pengajuan/{id}/approve', [DirekturController::class, 'approve'])->name('pengajuan.approve');
        Route::post('/pengajuan/{id}/decline', [DirekturController::class, 'decline'])->name('pengajuan.decline');
        Route::post('/pengajuan/{id}/revise', [DirekturController::class, 'revise'])->name('pengajuan.revise');
    });

    // ─────────────────────────────────────────
    // Secret routes
    // ─────────────────────────────────────────
    Route::prefix('secret')->name('secret.')->middleware('secret')->group(function () {
        Route::get('/settings', [SiteSettingController::class, 'index'])->name('settings.index');
        Route::put('/settings', [SiteSettingController::class, 'update'])->name('settings.update');

        Route::get('/appreciation', [AppreciationController::class, 'index'])->name('appreciation.index');

        Route::post('/appreciation/dev', [AppreciationController::class, 'storeDev'])->name('appreciation.dev.store');
        Route::put('/appreciation/dev/{id}', [AppreciationController::class, 'updateDev'])->name('appreciation.dev.update');
        Route::delete('/appreciation/dev/{id}', [AppreciationController::class, 'destroyDev'])->name('appreciation.dev.destroy');

        Route::post('/appreciation/doc', [AppreciationController::class, 'storeDoc'])->name('appreciation.doc.store');
        Route::put('/appreciation/doc/{id}', [AppreciationController::class, 'updateDoc'])->name('appreciation.doc.update');
        Route::delete('/appreciation/doc/{id}', [AppreciationController::class, 'destroyDoc'])->name('appreciation.doc.destroy');
    });

    // ─────────────────────────────────────────
    // Admin routes
    // ─────────────────────────────────────────
    Route::prefix('admin')->name('admin.')->middleware('admin')->group(function () {
        Route::get('/', fn() => redirect()->route('admin.dashboard'));
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Global search API (admin only)
        Route::get('/api/search', SearchController::class)->name('api.search');

        Route::get('/historis', [HistorisController::class, 'index'])->name('historis.index');
        Route::post('/historis/manual', [HistorisController::class, 'storeManual'])->name('historis.store_manual');
        Route::post('/historis/preview', [HistorisController::class, 'previewExcel'])->name('historis.preview_excel');
        Route::post('/historis/excel', [HistorisController::class, 'storeExcel'])->name('historis.store_excel');

        Route::get('/pengajuan/export', [PengajuanController::class, 'export'])->name('pengajuan.export');
        Route::get('/pengajuan', [PengajuanController::class, 'index'])->name('pengajuan.index');
        Route::get('/pengajuan/{id}', [PengajuanController::class, 'show'])->name('pengajuan.show');
        Route::put('/pengajuan/{id}', [PengajuanController::class, 'update'])->name('pengajuan.update');
        Route::put('/pengajuan/{id}/tanggal-pengajuan', [PengajuanController::class, 'updateTanggalPengajuan'])->name('pengajuan.update_tanggal_pengajuan');
        Route::delete('/pengajuan/bulk', [PengajuanController::class, 'bulkDestroy'])->name('pengajuan.bulk_destroy');
        Route::delete('/pengajuan/{id}', [PengajuanController::class, 'destroy'])->name('pengajuan.destroy');
        Route::put('/pengajuan/{id}/status', [PengajuanController::class, 'updateStatus'])->name('pengajuan.update_status');
        Route::put('/pengajuan/{id}/lokasi', [PengajuanController::class, 'updateLokasi'])->name('pengajuan.update_lokasi');
        Route::put('/pengajuan/{id}/force-status', [PengajuanController::class, 'updateForceStatus'])->name('pengajuan.force_status');

        // Pengajuan Logs — superadmin only edit/delete
        Route::put('/pengajuan-logs/{id}', [PengajuanController::class, 'updateLog'])->name('pengajuan_logs.update');
        Route::delete('/pengajuan-logs/{id}', [PengajuanController::class, 'destroyLog'])->name('pengajuan_logs.destroy');

        // Pegawai CRUD
        Route::get('/pegawai', [PegawaiController::class, 'index'])->name('pegawai.index');
        Route::post('/pegawai/import', [PegawaiController::class, 'import'])->name('pegawai.import');
        Route::post('/pegawai', [PegawaiController::class, 'store'])->name('pegawai.store');
        Route::delete('/pegawai/bulk', [PegawaiController::class, 'bulkDestroy'])->name('pegawai.bulk_destroy');
        Route::put('/pegawai/bulk-restore', [PegawaiController::class, 'bulkRestore'])->name('pegawai.bulk_restore');
        Route::put('/pegawai/{id}', [PegawaiController::class, 'update'])->name('pegawai.update');
        Route::delete('/pegawai/{id}', [PegawaiController::class, 'destroy'])->name('pegawai.destroy');
        Route::put('/pegawai/{id}/restore', [PegawaiController::class, 'restore'])->name('pegawai.restore');

        // Users CRUD
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/bulk', [UserController::class, 'bulkDestroy'])->name('users.bulk_destroy');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');

        // Aktivitas CRUD
        Route::get('/aktivitas/export', [AktivitasController::class, 'export'])->name('aktivitas.export');
        Route::post('/aktivitas/send-undangan', [AktivitasController::class, 'sendUndangan'])->name('aktivitas.send_undangan');
        Route::get('/aktivitas', [AktivitasController::class, 'index'])->name('aktivitas.index');
        Route::post('/aktivitas', [AktivitasController::class, 'store'])->name('aktivitas.store');   // ← BARU
        Route::get('/aktivitas/{id}', [AktivitasController::class, 'show'])->name('aktivitas.show');
        Route::put('/aktivitas/{id}', [AktivitasController::class, 'update'])->name('aktivitas.update');
        Route::delete('/aktivitas/bulk', [AktivitasController::class, 'bulkDestroy'])->name('aktivitas.bulk_destroy');
        Route::delete('/aktivitas/{id}', [AktivitasController::class, 'destroy'])->name('aktivitas.destroy');
        // Tim routes — berbasis Aktivitas (bukan Pengajuan)
        Route::post('/aktivitas/{id}/tim', [AktivitasController::class, 'storeTim'])->name('aktivitas.store_tim');
        Route::put('/aktivitas/{id}/tim', [AktivitasController::class, 'syncTim'])->name('aktivitas.sync_tim');
        Route::delete('/aktivitas/{aktivitasId}/tim/{timId}', [AktivitasController::class, 'destroyTim'])->name('aktivitas.destroy_tim');

        // Testimoni CRUD
        Route::get('/testimoni', [TestimoniController::class, 'index'])->name('testimoni.index');
        Route::post('/testimoni', [TestimoniController::class, 'store'])->name('testimoni.store');
        Route::put('/testimoni/{id}', [TestimoniController::class, 'update'])->name('testimoni.update');
        Route::delete('/testimoni/bulk', [TestimoniController::class, 'bulkDestroy'])->name('testimoni.bulk_destroy');
        Route::delete('/testimoni/{id}', [TestimoniController::class, 'destroy'])->name('testimoni.destroy');

        // Master Data (Jenis PKM)
        Route::get('/master/jenis-pkm', [MasterDataController::class, 'indexJenis'])->name('master.jenis.index');
        Route::post('/master/jenis-pkm', [MasterDataController::class, 'storeJenis'])->name('master.jenis.store');
        Route::put('/master/jenis-pkm/{id}', [MasterDataController::class, 'updateJenis'])->name('master.jenis.update');
        Route::delete('/master/jenis-pkm/bulk', [MasterDataController::class, 'bulkDestroyJenis'])->name('master.jenis.bulk_destroy');
        Route::delete('/master/jenis-pkm/{id}', [MasterDataController::class, 'destroyJenis'])->name('master.jenis.destroy');

        // Template Dokumen
        Route::get('/templates', [TemplateDokumenController::class, 'index'])->name('templates.index');
        Route::post('/templates', [TemplateDokumenController::class, 'store'])->name('templates.store');
        Route::delete('/templates/{jenis}', [TemplateDokumenController::class, 'destroy'])->name('templates.destroy');

        // Arsip CRUD
        Route::get('/arsip', [ArsipController::class, 'index'])->name('arsip.index');
        Route::post('/arsip', [ArsipController::class, 'store'])->name('arsip.store');
        Route::put('/arsip/{id}', [ArsipController::class, 'update'])->name('arsip.update');
        Route::delete('/arsip/bulk', [ArsipController::class, 'bulkDestroy'])->name('arsip.bulk_destroy');
        Route::delete('/arsip/{id}', [ArsipController::class, 'destroy'])->name('arsip.destroy');

        // Kontak CRUD
        Route::get('/kontak', [KontakController::class, 'index'])->name('kontak.index');
        Route::post('/kontak', [KontakController::class, 'store'])->name('kontak.store');
        Route::put('/kontak/visitor-offset', [KontakController::class, 'updateVisitorOffset'])->name('kontak.update_visitor_offset');
        Route::put('/kontak/{id}', [KontakController::class, 'update'])->name('kontak.update');
        Route::delete('/kontak/bulk', [KontakController::class, 'bulkDestroy'])->name('kontak.bulk_destroy');
        Route::delete('/kontak/{id}', [KontakController::class, 'destroy'])->name('kontak.destroy');

        // Evaluasi Sistem
        Route::get('/evaluasi-sistem', [EvaluasiSistemController::class, 'index'])->name('evaluasi-sistem.index');
        Route::patch('/evaluasi-sistem/{id}/date', [EvaluasiSistemController::class, 'updateDate'])->name('evaluasi-sistem.update_date');
        Route::delete('/evaluasi-sistem/bulk', [EvaluasiSistemController::class, 'bulkDestroy'])->name('evaluasi-sistem.bulk_destroy');
        Route::delete('/evaluasi-sistem/{id}', [EvaluasiSistemController::class, 'destroy'])->name('evaluasi-sistem.destroy');

        Route::get('/api/notifications', [NotificationController::class, 'index'])->name('api.notifications');
        Route::post('/api/notifications/mark-read', [NotificationController::class, 'markRead'])->name('api.notifications.mark-read');
        Route::post('/api/notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('api.notifications.mark-all-read');

        // (Import History routes merged into /historis)
        // Test email route (development only)
        Route::get('/test-email/{email}', [MailTestController::class, 'send']);
    });
});
