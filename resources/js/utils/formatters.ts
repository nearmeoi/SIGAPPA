/**
 * Utilitas untuk format string, angka, tanggal, dan mata uang.
 * Sentralisasi fungsi agar konsisten di seluruh aplikasi.
 */

/**
 * Format angka menjadi format Rupiah (IDR)
 * 
 * @param value Nilai angka (number atau string)
 * @param withPrefix Apakah menampilkan prefix 'Rp ' (default: true)
 * @returns string format rupiah
 */
export const formatRupiah = (value: number | string | null | undefined, withPrefix = true): string => {
    const num = Number(value || 0);
    const formatted = num.toLocaleString('id-ID');
    return withPrefix ? `Rp ${formatted}` : formatted;
};

/**
 * Format tanggal menjadi format Indonesia (contoh: 15 Jan 2026)
 * 
 * @param date Objek Date atau string tanggal (ISO/YYYY-MM-DD)
 * @param options Opsi kustomisasi Intl.DateTimeFormatOptions
 * @returns string tanggal yang terformat
 */
export const formatDateID = (date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
    if (!date) return '-';
    try {
        const d = new Date(date);
        // Cek invalid date
        if (isNaN(d.getTime())) return '-';

        const defaultOptions: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        };

        return new Intl.DateTimeFormat('id-ID', options || defaultOptions).format(d);
    } catch (e) {
        return '-';
    }
};

/**
 * Format angka besar dengan pemisah ribuan (contoh: 1.500.000)
 * Berguna untuk statistik (views, jumlah pengunjung)
 * 
 * @param value Nilai angka
 * @returns string angka terformat
 */
export const formatNumberID = (value: number | string | null | undefined): string => {
    const num = Number(value || 0);
    return num.toLocaleString('id-ID');
};
