import React, { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { extractDynamicPkmTypes } from "@/data/pkmMapVisuals";
import type { PkmData } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const COLORS = {
  grid: "rgba(148, 163, 180, 0.12)",
  textMuted: "#64748b",
};

interface ChartSource {
  barData: ChartData<"bar">;
  doughnutData: ChartData<"doughnut">;
}

const buildBarOptions = (compactMobile = false): ChartOptions<"bar"> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: !compactMobile,
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 20,
        font: { size: 12, weight: 600, family: "'Segoe UI', sans-serif" },
        color: COLORS.textMuted,
      },
    },
    title: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleFont: { size: 13, weight: 700 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      displayColors: true,
      usePointStyle: true,
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} kegiatan`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { size: compactMobile ? 11 : 12, weight: 600 },
        color: COLORS.textMuted,
        padding: 10,
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: COLORS.grid },
      ticks: {
        stepSize: 1,
        precision: 0,
        font: { size: compactMobile ? 10 : 12 },
        color: COLORS.textMuted,
      },
    },
  },
});

const buildDoughnutOptions = (
  compactMobile = false,
): ChartOptions<"doughnut"> => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: compactMobile ? "70%" : "62%",
  plugins: {
    legend: {
      display: !compactMobile,
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 16,
        font: { size: 12, weight: 600, family: "'Segoe UI', sans-serif" },
        color: COLORS.textMuted,
        boxWidth: compactMobile ? 8 : 10,
      },
    },
    title: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleFont: { size: 13, weight: 700 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.parsed} kegiatan`,
      },
    },
  },
});

const buildChartSource = (pkmData: PkmData[] = []): ChartSource => {
  if (!Array.isArray(pkmData) || pkmData.length === 0) {
    return {
      barData: { labels: [], datasets: [] },
      doughnutData: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderColor: "#ffffff",
            borderWidth: 3,
            hoverOffset: 14,
          },
        ],
      },
    };
  }

  const typesMeta = extractDynamicPkmTypes(pkmData);
  const years = [
    ...new Set(
      pkmData
        .map((item) => Number(item?.tahun))
        .filter((year) => Number.isFinite(year)),
    ),
  ].sort((a, b) => a - b);

  const barDatasets = typesMeta.map((typeMeta) => ({
    label: typeMeta.label,
    data: years.map(
      (year) =>
        pkmData.filter(
          (item) =>
            Number(item?.tahun) === year &&
            (String(item?.jenis_pkm ?? "").trim() || "Lainnya") ===
              typeMeta.key,
        ).length,
    ),
    backgroundColor: typeMeta.color,
    borderRadius: 6,
    borderSkipped: false as const,
    barPercentage: 0.8,
    categoryPercentage: 0.8,
  }));

  const doughnutTotals = typesMeta.map((typeMeta) => ({
    label: typeMeta.label,
    total: pkmData.filter(
      (item) =>
        (String(item?.jenis_pkm ?? "").trim() || "Lainnya") === typeMeta.key,
    ).length,
    color: typeMeta.color,
  }));

  return {
    barData: {
      labels: years,
      datasets: barDatasets,
    },
    doughnutData: {
      labels: doughnutTotals.map((item) => item.label),
      datasets: [
        {
          data: doughnutTotals.map((item) => item.total),
          backgroundColor: doughnutTotals.map((item) => item.color),
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 14,
        },
      ],
    },
  };
};

const CustomLegend = ({ labels, colors }: { labels: string[], colors: string[] }) => {
  return (
    <div className="md:hidden mt-6 px-4 pb-6 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-50 pb-2">Keterangan Jenis PKM</p>
      <div className="grid grid-cols-1 gap-y-1">
        {labels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-3 py-1 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-white" 
              style={{ backgroundColor: colors[idx] }}
            />
            <span className="text-xs font-bold text-slate-600 truncate max-w-[240px]" title={label}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LandingChartsProps {
  compactMobile?: boolean;
  pkmData?: PkmData[];
}

export default function LandingCharts({
  compactMobile = false,
  pkmData = [],
}: LandingChartsProps) {
  const chartSource = useMemo(() => buildChartSource(pkmData), [pkmData]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const barOptions = useMemo(
    () => buildBarOptions(compactMobile || isMobile),
    [compactMobile, isMobile],
  );
  const doughnutOptions = useMemo(
    () => buildDoughnutOptions(compactMobile || isMobile),
    [compactMobile, isMobile],
  );

  const typesMeta = useMemo(() => extractDynamicPkmTypes(pkmData), [pkmData]);

  return (
    <section className="px-3 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-10" id="visualisasi-data">
      {/* Bar Chart */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl shadow-sigappa-navy/5 border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-chart-column text-base sm:text-lg"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
                Jumlah PKM Per Tahun
              </h3>
              <p className="text-[10px] sm:text-sm font-bold text-slate-400 mt-0.5 sm:mt-1 leading-snug line-clamp-1">
                Perbandingan jumlah PKM berdasarkan jenis program
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 h-[280px] sm:h-[400px] flex items-center justify-center relative">
          {pkmData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center p-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                <i className="fa-solid fa-chart-column text-xl sm:text-2xl"></i>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400">Belum ada data PKM</p>
            </div>
          ) : (
            <Bar data={chartSource.barData} options={barOptions} />
          )}
        </div>
        
        {pkmData.length > 0 && isMobile && (
          <CustomLegend 
            labels={typesMeta.map(t => t.label)} 
            colors={typesMeta.map(t => t.color)} 
          />
        )}
      </div>

      {/* Doughnut Chart */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl shadow-sigappa-navy/5 border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-chart-pie text-base sm:text-lg"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
                Capaian Berdasarkan Jenis PKM
              </h3>
              <p className="text-[10px] sm:text-sm font-bold text-slate-400 mt-0.5 sm:mt-1 leading-snug line-clamp-1">
                Distribusi jenis PKM pada lokasi pengabdian
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 h-[280px] sm:h-[400px] flex items-center justify-center relative">
          {pkmData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center p-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                <i className="fa-solid fa-chart-pie text-xl sm:text-2xl"></i>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400">Belum ada data PKM</p>
            </div>
          ) : (
            <Doughnut data={chartSource.doughnutData} options={doughnutOptions} />
          )}
        </div>

        {pkmData.length > 0 && isMobile && (
          <CustomLegend 
            labels={typesMeta.map(t => t.label)} 
            colors={typesMeta.map(t => t.color)} 
          />
        )}
      </div>
    </section>
  );
}
