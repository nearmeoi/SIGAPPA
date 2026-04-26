<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/png" href="{{ asset('logo-poltekpar.png') }}">
    <title inertia>{{ config('app.name', 'SIGAPPA') }}</title>
    
    <!-- SEO Meta Tags -->
    <meta name="google-site-verification" content="agJTvy1ftzsZejX7UQBlgbQdZjhHRZl_cZ9ZdWraX6Q" />
    <meta name="description" content="SIGAPPA: Portal Geospasial PKM & Layanan Pariwisata Terpadu Poltekpar Makassar. Ajukan permohonan pengabdian masyarakat secara digital dan transparan.">
    <meta name="keywords" content="SIGAPPA, SIGAPPA Poltekpar, SIGAPPA Poltekpar Makassar, Peta PKM Poltekpar, Geospasial Pariwisata Makassar, Pengabdian Masyarakat Poltekpar, SIGAPPA Makassar, Geospasial Poltekpar">
    <meta name="author" content="Politeknik Pariwisata Makassar">
    <meta name="robots" content="index, follow">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:site_name" content="SIGAPPA">
    <meta property="og:title" content="SIGAPPA - Portal Geospasial & Layanan PKM Poltekpar Makassar">
    <meta property="og:description" content="Sistem Informasi Geospasial dan Akses Pelayanan Pariwisata Politeknik Pariwisata Makassar.">
    <meta property="og:image" content="{{ asset('logo-poltekpar.png') }}">

    <!-- Structured Data for Site Name -->
    <script type="application/ld+json">
    {
      "@@context": "https://schema.org",
      "@@type": "WebSite",
      "name": "SIGAPPA",
      "alternateName": ["SIGAPPA Poltekpar", "Sistem Informasi Geospasial Poltekpar"],
      "url": "https://sigappa.poltekparmakassar.ac.id/"
    }
    </script>

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url('/') }}">
    <meta property="twitter:title" content="SIGAPPA - Politeknik Pariwisata Makassar">
    <meta property="twitter:description" content="Portal Sistem Informasi Geospasial dan Akses Pelayanan Pariwisata Politeknik Pariwisata Makassar.">
    <meta property="twitter:image" content="{{ asset('logo-poltekpar.png') }}">

    <!-- Fonts: Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite('resources/js/app.tsx')
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>