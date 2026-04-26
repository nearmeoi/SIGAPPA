<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UndanganMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientName;

    public string $recipientEmail;

    public string $judulKegiatan;

    public string $subject_text;

    public string $body_text;

    public string $tglMulai;

    public string $tglSelesai;

    public string $lokasi;

    public string $jenisPkm;

    public string $sentDate;

    public function __construct(
        string $recipientName,
        string $judulKegiatan,
        string $subject,
        string $body,
        string $recipientEmail = '',
        string $tglMulai = '',
        string $tglSelesai = '',
        string $lokasi = '',
        string $jenisPkm = ''
    ) {
        $this->recipientName = $recipientName;
        $this->recipientEmail = $recipientEmail;
        $this->judulKegiatan = $judulKegiatan;
        $this->subject_text = $subject;
        $this->body_text = $body;
        $this->tglMulai = $tglMulai;
        $this->tglSelesai = $tglSelesai;
        $this->lokasi = $lokasi;
        $this->jenisPkm = $jenisPkm;
        $this->sentDate = now()->locale('id')->isoFormat('D MMMM YYYY');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject_text,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.undangan',
        );
    }
}
