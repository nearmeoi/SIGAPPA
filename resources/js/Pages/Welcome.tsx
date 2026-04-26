import React from 'react';
import { Head, Link } from '@inertiajs/react';
import '../../css/welcome.css';

export default function Welcome() {
    return (
        <>
            <Head>
                <title>Portal Resmi</title>
                <meta name="description" content="Portal SIGAPPA Politeknik Pariwisata Makassar. Layanan geospasial dan akses pelayanan pariwisata terpadu." />
                <link rel="canonical" href="https://sigappa.poltekparmakassar.ac.id" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Politeknik Pariwisata Makassar",
                        "url": "https://sigappa.poltekparmakassar.ac.id",
                        "logo": "https://sigappa.poltekparmakassar.ac.id/logo-poltekpar.png",
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "telephone": "+62-411-XXXXXX",
                            "contactType": "customer service"
                        }
                    })}
                </script>
            </Head>
            <div className="welcome-page">
                {/* Immersive Background Glow */}
                <div className="welcome-glow welcome-glow--1"></div>
                <div className="welcome-glow welcome-glow--2"></div>

                <div className="welcome-wrapper">
                    <div className="welcome-main-card">
                        {/* Left Column: Image Fill */}
                        <div className="welcome-hero-image">
                            <div className="welcome-hero-overlay"></div>
                            <div className="welcome-hero-badge">SIGAPPA &bull; Geospasial</div>
                        </div>

                        {/* Right Column: Refined Typography Hierarchy */}
                        <div className="welcome-portal-side">
                            <div className="welcome-portal-inner">

                                {/* 1. Brand Logo */}
                                <div className="welcome-logo-container">
                                    <img
                                        src="/logo-poltekpar.png"
                                        alt="Logo Politeknik Pariwisata Makassar"
                                        className="welcome-portal-logo"
                                    />
                                </div>

                                {/* 2. Hero Typography Group */}
                                <div className="welcome-hero-group">
                                    <span className="welcome-hero-greeting">Selamat Datang Kembali di.</span>
                                    <h1 className="welcome-hero-brand" title="SIGAPPA - Sistem Informasi Geospasial Politeknik Pariwisata Makassar">SIGAPPA</h1>
                                    <div className="welcome-hero-divider"></div>
                                </div>

                                {/* 3. Detailed Info Group */}
                                <div className="welcome-info-group">
                                    <h2 className="welcome-system-name">
                                        Sistem Informasi Geospasial dan Akses Pelayanan Pariwisata
                                    </h2>
                                    <p className="welcome-institution-name">
                                        Politeknik Pariwisata Makassar
                                    </p>
                                </div>

                                {/* 4. Action Group */}
                                <div className="welcome-action-group">
                                    <Link href="/beranda" className="welcome-btn-main">
                                        Mulai Sekarang
                                    </Link>
                                    <Link href="/panduan" className="welcome-btn-sub">
                                        <span>Panduan Pengguna</span>
                                        <i className="fa-solid fa-book-open"></i>
                                    </Link>

                                    {/* Quick Access directly inside or below with less gap */}
                                    <div className="welcome-external-portals">
                                        <div className="welcome-external-label">Akses Cepat:</div>
                                        <div className="welcome-external-links">
                                            <a href="https://poltekparmakassar.siakadcloud.com/gate/login" target="_blank" rel="noopener noreferrer" className="welcome-external-item" title="SIAKAD Poltekpar Makassar">
                                                <div className="welcome-external-icon">
                                                    <i className="fa-solid fa-graduation-cap"></i>
                                                </div>
                                                <span className="welcome-external-text">SIAKAD</span>
                                            </a>
                                            <div className="welcome-external-divider"></div>
                                            <a href="https://sippma-poltekparmks.id/dosen/auth" target="_blank" rel="noopener noreferrer" className="welcome-external-item" title="SIPPMA Poltekpar Makassar">
                                                <div className="welcome-external-icon">
                                                    <i className="fa-solid fa-flask"></i>
                                                </div>
                                                <span className="welcome-external-text">SIPPMA</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="welcome-bottom-footer">
                        &copy; {new Date().getFullYear()} SIGAPPA &bull; Politeknik Pariwisata Makassar
                    </div>
                </div>
            </div>
        </>
    );
}
