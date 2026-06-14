import React, { useState, useMemo } from "react";
import { Head } from "@inertiajs/react";
import { Eye } from "lucide-react";
import Layout from "@/Layouts/DefaultLayout";
import LandingCharts from '@/Components/dashboard/LandingCharts';
import { usePkmData } from '@/hooks/usePkmData';
import CTABanner from "@/Components/pkm/CTABanner";
import PkmMapDashboardCard from "@/Components/map/PkmMapDashboardCard";
import TestimonialSection from "@/Components/testimonial/TestimonialSection";


import { PkmData, TestimoniItem, VisitorStats } from "@/types";
import "../../css/landing.css";

interface TestimoniStats {
  total_feedback: number;
  avg_rating: number;
  total_testimoni: number;
}

interface LandingPageProps {
  pkmData?: PkmData[] | null;
  publicPkmData?: PkmData[] | null;
  testimonials?: TestimoniItem[] | null;
  testimoniStats?: TestimoniStats | null;
  visitorStats?: VisitorStats | null;
}

export default function LandingPage({
  pkmData: serverPkmData = null,
  publicPkmData = null,
  testimonials = [],
  testimoniStats = null,
  visitorStats = null,
}: LandingPageProps) {
  const { data: pkmData } = usePkmData({ 
    type: 'public', 
    serverData: publicPkmData ?? serverPkmData 
  });

  return (
    <Layout
      mainClassName="site-main-content"
      mainStyle={{
        flex: "1",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
      }}
    >
      <Head>
        <title>Beranda & Peta PKM</title>
        <meta name="description" content="Peta sebaran kegiatan pengabdian masyarakat (PKM) dan layanan pariwisata terpadu Politeknik Pariwisata Makassar." />
        <link rel="canonical" href="https://sigappa.poltekparmakassar.ac.id/beranda" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Apa itu SIGAPPA?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "SIGAPPA adalah Sistem Informasi Geospasial dan Akses Pelayanan Pariwisata Politeknik Pariwisata Makassar yang digunakan untuk pemetaan PKM dan layanan publik."
                }
              },
              {
                "@type": "Question",
                "name": "Bagaimana cara mengajukan PKM di SIGAPPA?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Anda dapat mendaftar sebagai pemohon di menu Login/Register, lalu mengisi form pengajuan PKM yang tersedia."
                }
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Selamat Datang",
                "item": "https://sigappa.poltekparmakassar.ac.id"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Beranda",
                "item": "https://sigappa.poltekparmakassar.ac.id/beranda"
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "SIGAPPA",
            "description": "Sistem Informasi Geospasial dan Akses Pelayanan Pariwisata",
            "url": "https://sigappa.poltekparmakassar.ac.id",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "author": {
              "@type": "Organization",
              "name": "Politeknik Pariwisata Makassar"
            }
          })}
        </script>
      </Head>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 flex-1 flex flex-col py-6 sm:py-8 md:py-12 gap-8 sm:gap-12 md:gap-16">
        <section className="space-y-4 sm:space-y-5">
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              Dashboard Sebaran{" "}
              <span className="text-poltekpar-primary">PKM</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-500">
              Sistem Informasi PKM Poltekpar Makassar Berbasis Geospasial, Peta
              Interaktif, Statistik Pelaksanaan, dan Daftar Kegiatan.
            </p>
          </div>
          <PkmMapDashboardCard
            pkmData={pkmData}
            watchKey="landing-map"
            showTitle={false}
          />
        </section>

        <TestimonialSection
          testimonials={testimonials || []}
          stats={testimoniStats}
        />
        <CTABanner />
      </div>
    </Layout>
  );
}
