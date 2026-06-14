import React from "react";
import { TestimoniItem } from "@/types";

interface TestimoniStats {
  total_feedback: number;
  avg_rating: number;
  total_testimoni: number;
}

interface TestimonialSectionProps {
  testimonials: TestimoniItem[];
  stats?: TestimoniStats | null;
}

export default function TestimonialSection({
  testimonials,
  stats,
}: TestimonialSectionProps) {
  const hasTestimonials = testimonials && testimonials.length > 0;
  const hasStats =
    stats &&
    (stats.total_feedback > 0 ||
      stats.avg_rating > 0 ||
      stats.total_testimoni > 0);
  if (!hasTestimonials && !hasStats) return null;

  return (
    <section className="py-10 sm:py-16 bg-slate-50/50 border-y border-slate-100 my-4 rounded-[32px] sm:rounded-[40px]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-6">
          <div className="max-w-xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-poltekpar-primary/10 text-poltekpar-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Suara Masyarakat
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Apa Kata{" "}
              <span className="text-poltekpar-primary">Masyarakat?</span>
            </h2>
            <p className="mt-4 text-slate-500 font-medium text-base sm:text-lg text-balance">
              Feedback berharga dari para peserta kegiatan Pengabdian Kepada
              Masyarakat (PKM).
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/evaluasi"
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-poltekpar-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-poltekpar-navy hover:-translate-y-0.5 transition-all active:scale-95 min-h-[48px]"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                Berikan Feedback
              </a>
            </div>
          </div>

          {/* Stat Card */}
          <div className="flex flex-row gap-4 md:gap-5 flex-shrink-0">
            {/* Card: Rata-rata Rating */}
            <div className="flex flex-row items-center justify-between gap-4 bg-white rounded-[24px] px-6 py-5 border border-slate-100 shadow-md shadow-slate-200/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-w-[180px] sm:min-w-[200px]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">
                  Rata-rata
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Kepuasaan Masyarakat
                </p>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 leading-none mt-2">
                  {stats?.avg_rating?.toFixed(1) ?? "—"}
                </p>
              </div>
              <i className="fa-solid fa-star text-amber-400 text-6xl sm:text-7xl flex-shrink-0"></i>
            </div>
          </div>
        </div>

        {/* Slider Container */}
        {hasTestimonials && (
          <div className="relative group">
            <div className="flex overflow-x-auto pb-10 gap-6 snap-x snap-mandatory scrollbar-hide custom-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 items-stretch">
              {testimonials.map((item, index) => (
                <div
                  key={index}
                  className="flex-none w-[280px] sm:w-[320px] snap-start bg-white rounded-[32px] p-8 sm:p-8 border border-slate-100 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-500 flex flex-col group/card"
                >
                  {/* Header: Rating & Quote Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fa-solid fa-star text-[11px] ${i < item.rating ? "" : "text-slate-100"}`}
                        ></i>
                      ))}
                    </div>
                    <i className="fa-solid fa-quote-right text-slate-100 text-3xl group-hover/card:text-blue-50 transition-colors"></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 mb-8 px-1">
                    <p className="text-slate-600 italic leading-relaxed text-sm sm:text-base font-medium line-clamp-6">
                      "
                      {item.pesan_ulasan ||
                        "Layanan yang sangat memuaskan dan bermanfaat."}
                      "
                    </p>
                  </div>

                  {/* Footer: Identity */}
                  <div className="pt-8 border-t border-slate-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-lg border-2 border-white shadow-inner group-hover/card:from-poltekpar-primary group-hover/card:to-poltekpar-navy group-hover/card:text-white transition-all duration-500 flex-shrink-0">
                      {item.nama_pemberi.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {item.nama_pemberi}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                        {(item as any).asal_instansi || "Masyarakat Umum"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasTestimonials && (
          <div className="mt-10 text-center md:hidden">
            <div className="inline-flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] bg-white px-8 py-4 rounded-full shadow-sm border border-slate-100 min-h-[44px]">
              <i className="fa-solid fa-left-right animate-bounce-x"></i>
              <span>Geser ke samping</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
