<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi untuk penyimpanan data historis PKM (manual maupun per-baris Excel).
 *
 * Digunakan oleh:
 * - HistorisController@storeManual
 * - HistorisController@storeExcel (validasi per-baris)
 *
 * @see \App\Http\Controllers\Admin\HistorisController
 */
class StoreHistorisRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Otorisasi sudah dijaga oleh middleware role di routes/web.php
        return true;
    }

    public function rules(): array
    {
        return self::validationRules();
    }

    /**
     * Aturan validasi statis agar bisa dipakai juga untuk validasi batch Excel
     * tanpa harus membuat instance FormRequest.
     */
    public static function validationRules(): array
    {
        return [
            // --- Informasi Umum ---
            'judul_kegiatan'     => 'required|string|max:255',
            'id_jenis_pkm'       => 'required|exists:jenis_pkm,id_jenis_pkm',
            'tgl_mulai'          => 'nullable|date',
            'tgl_selesai'        => 'nullable|date|after_or_equal:tgl_mulai',
            'is_tahun_saja'      => 'nullable|boolean',

            // --- Lokasi ---
            'provinsi'           => 'nullable|string|max:100',
            'kota_kabupaten'     => 'nullable|string|max:100',
            'kecamatan'          => 'nullable|string|max:100',
            'kelurahan_desa'     => 'nullable|string|max:100',
            'alamat_lengkap'     => 'nullable|string',
            'latitude'           => 'nullable|numeric|between:-90,90',
            'longitude'          => 'nullable|numeric|between:-180,180',

            // --- Pendanaan ---
            'total_anggaran'           => 'nullable|numeric|min:0',
            'sumber_dana_tambahan'     => 'nullable|string|max:255',
            'dana_perguruan_tinggi'    => 'nullable|numeric|min:0',
            'dana_pemerintah'          => 'nullable|numeric|min:0',
            'dana_lembaga_dalam'       => 'nullable|numeric|min:0',
            'dana_lembaga_luar'        => 'nullable|numeric|min:0',

            // --- Tim Pelaksana ---
            'ketua_tim'            => 'required|string|max:100',
            'dosen_terlibat'       => 'nullable|array',
            'dosen_terlibat.*'     => 'nullable|string|max:100',
            'staff_terlibat'       => 'nullable|array',
            'staff_terlibat.*'     => 'nullable|string|max:100',
            'mahasiswa_terlibat'   => 'nullable|array',
            'mahasiswa_terlibat.*' => 'nullable|string|max:100',

            // --- Testimoni (opsional) ---
            'testimoni_link'   => 'nullable|string',
            'testimoni_nama'   => 'nullable|string',

            // --- Arsip Eksternal ---
            'link_laporan_akhir'   => 'nullable|string',
            'link_dokumentasi'     => 'nullable|string',
            'link_tambahan'        => 'nullable|array',
            'link_tambahan.*.nama' => 'nullable|string|max:100',
            'link_tambahan.*.url'  => 'nullable|string',
        ];
    }

    /**
     * Pesan error berbahasa Indonesia agar user-friendly.
     */
    public function messages(): array
    {
        return [
            'judul_kegiatan.required' => 'Judul kegiatan PKM wajib diisi.',
            'judul_kegiatan.max'      => 'Judul kegiatan maksimal 255 karakter.',
            'id_jenis_pkm.required'   => 'Jenis PKM wajib dipilih.',
            'id_jenis_pkm.exists'     => 'Jenis PKM yang dipilih tidak valid.',
            'tgl_selesai.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
            'ketua_tim.required'      => 'Nama ketua tim wajib diisi.',
            'latitude.between'        => 'Latitude harus antara -90 dan 90.',
            'longitude.between'       => 'Longitude harus antara -180 dan 180.',
            'total_anggaran.min'      => 'Total anggaran tidak boleh negatif.',
        ];
    }
}
