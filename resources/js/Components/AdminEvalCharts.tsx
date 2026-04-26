import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface PieChartItem {
    label: string;
    color: string;
    count: number;
}

interface BarDataset {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius?: number;
    barPercentage?: number;
    categoryPercentage?: number;
}

interface AdminEvalChartsProps {
    pieChartData: PieChartItem[];
    barChartData: {
        labels: number[];
        datasets: BarDataset[];
    };
}

const COLORS = {
    grid: 'rgba(148, 163, 180, 0.12)',
    textMuted: '#64748b',
};

const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: { size: 12, weight: 600, family: "'Segoe UI', sans-serif" },
                color: COLORS.textMuted,
            },
        },
        title: { display: false },
        tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 13, weight: 'bold' },
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
                font: { size: 12, weight: 600 },
                color: COLORS.textMuted,
            },
        },
        y: {
            beginAtZero: true,
            grid: { color: COLORS.grid },
            ticks: {
                stepSize: 1,
                precision: 0,
                font: { size: 12 },
                color: COLORS.textMuted,
            },
        },
    },
};

const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                font: { size: 12, weight: 600, family: "'Segoe UI', sans-serif" },
                color: COLORS.textMuted,
                boxWidth: 10,
            },
        },
        title: { display: false },
        tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} pengajuan`,
            },
        },
    },
};

export default function AdminEvalCharts({ pieChartData, barChartData }: AdminEvalChartsProps) {
    const barChartReady = useMemo<ChartData<'bar'>>(() => ({
        labels: barChartData.labels,
        datasets: barChartData.datasets.map((ds) => ({
            ...ds,
            borderRadius: ds.borderRadius ?? 6,
            barPercentage: ds.barPercentage ?? 0.55,
            categoryPercentage: ds.categoryPercentage ?? 0.7,
        })),
    }), [barChartData]);

    const doughnutChartReady = useMemo<ChartData<'doughnut'>>(() => ({
        labels: pieChartData.map((item) => item.label),
        datasets: [
            {
                data: pieChartData.map((item) => item.count),
                backgroundColor: pieChartData.map((item) => item.color),
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 14,
            },
        ],
    }), [pieChartData]);

    const totalPengajuan = pieChartData.reduce((sum, item) => sum + item.count, 0);

    return (
        <section className="px-2 py-6 space-y-6" id="admin-eval-charts">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-lg">
                    <i className="fa-solid fa-chart-mixed text-sm"></i>
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Evaluasi PKM</h2>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Data langsung dari database</p>
                </div>
                <div className="ml-auto px-4 py-2 bg-poltekpar-primary/10 text-poltekpar-primary rounded-2xl text-sm font-black">
                    {totalPengajuan} Pengajuan
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Bar Chart — Tren Pertahun per Jenis PKM */}
                <div className="lg:col-span-3 bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-md">
                            <i className="fa-solid fa-chart-column text-xs"></i>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900">Tren PKM Per Tahun</h3>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Jumlah pengajuan per tahun berdasarkan jenis PKM</p>
                        </div>
                    </div>
                    <div className="p-4 h-72">
                        {barChartData.labels.length > 0 ? (
                            <Bar data={barChartReady} options={barOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-300">
                                <div className="text-center">
                                    <i className="fa-solid fa-chart-column text-4xl mb-2"></i>
                                    <p className="text-xs font-bold text-slate-400">Belum ada data pengajuan</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Doughnut Chart — Sebaran Jenis PKM */}
                <div className="lg:col-span-2 bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md">
                            <i className="fa-solid fa-chart-pie text-xs"></i>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900">Sebaran Jenis PKM</h3>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Distribusi jenis PKM seluruh pengajuan</p>
                        </div>
                    </div>
                    <div className="p-4 h-72">
                        {pieChartData.length > 0 ? (
                            <Doughnut data={doughnutChartReady} options={doughnutOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-300">
                                <div className="text-center">
                                    <i className="fa-solid fa-chart-pie text-4xl mb-2"></i>
                                    <p className="text-xs font-bold text-slate-400">Belum ada data jenis PKM</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend Pills */}
            {pieChartData.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                    {pieChartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                            <span className="text-[11px] font-bold text-slate-600">{item.label}</span>
                            <span className="text-[10px] font-black text-slate-400">{item.count}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
