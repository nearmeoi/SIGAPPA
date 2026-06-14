<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\UndanganMail;
use Illuminate\Support\Facades\Mail;

class MailTestController extends Controller
{
    /**
     * Send a test email.
     */
    public function send(string $email)
    {
        $mail = new UndanganMail(
            'Akmal Rijal',
            'PKM Pemberdayaan Masyarakat Desa Telling',
            'Undangan Kegiatan PKM - Politeknik Tourism Makassar',
            'Dengan hormat, kami mengundang Anda untuk menghadiri kegiatan Program Kreativitas Masyarakat (PKM) yang akan segera dilaksanakan. Mohon persiapan dan konfirmasi kehadiran Anda sebelum tanggal pelaksanaan.',
            $email,
            '15 April 2026',
            '30 April 2026',
            'Makassar, Sulawesi Selatan',
            'PKM Pengabdian'
        );

        Mail::to($email)->send($mail);

        return response()->json(['success' => true, 'message' => 'Test email sent to ' . $email]);
    }
}
