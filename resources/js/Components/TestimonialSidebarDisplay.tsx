import React, { useState } from 'react';
import TestimonialForm from './TestimonialForm';

interface Testimonial {
    id: number;
    name: string;
    role: string;
    rating: number;
    text: string;
    date: string;
}

interface TestimonialSidebarDisplayProps {
    status: string;
}

const StarIcon: React.FC<{ filled?: boolean; half?: boolean }> = ({ filled = true, half = false }) => {
    if (half) {
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="star-icon">
                <defs>
                    <linearGradient id="half-star-gradient">
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="50%" stopColor="#e2e8f0" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#half-star-gradient)" />
            </svg>
        );
    }

    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="star-icon">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={filled ? '#f59e0b' : '#e2e8f0'} />
        </svg>
    );
};

export default function TestimonialSidebarDisplay({ status }: TestimonialSidebarDisplayProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Only show testimonials for completed projects
    if (status !== 'selesai') return null;

    const testimonials: Testimonial[] = [
        {
            id: 1,
            name: "Bapak Budi",
            role: "Warga Setempat",
            rating: 4.5,
            text: "Program pendampingan ini sangat membantu UMKM di desa kami. Fasilitas dan ilmu dari dosen Poltekpar benar-benar membuka wawasan kami tentang manajemen usaha digital secara praktis.",
            date: "2 Bulan lalu"
        }
    ];

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<StarIcon key={i} filled={true} />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<StarIcon key={i} half={true} />);
            } else {
                stars.push(<StarIcon key={i} filled={false} />);
            }
        }
        return stars;
    };

    return (
        <div className="mt-6">
            {/* Section Title */}
            <div className="flex items-center gap-2 mb-4">
                <i className="fa-solid fa-comments text-xl" style={{ color: '#15325F' }}></i>
                <span className="text-base font-bold text-slate-900">Ulasan & Testimoni Masyarakat</span>
            </div>

            {/* Testimonial List */}
            <div className="space-y-3">
                {testimonials.map((item) => (
                    <div key={item.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white font-bold text-sm">
                                {item.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <span className="block text-sm font-semibold text-slate-900">{item.name}</span>
                                <span className="block text-xs text-slate-500">{item.role}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg">
                                <span className="text-sm font-bold text-amber-700">{item.rating}</span>
                                <i className="fa-solid fa-star text-xs text-amber-500"></i>
                            </div>
                        </div>

                        {/* Stars Row */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                {renderStars(item.rating)}
                            </div>
                            <span className="text-xs text-slate-400">{item.date}</span>
                        </div>

                        {/* Text */}
                        <p className="text-sm text-slate-700 leading-relaxed italic">
                            "{item.text}"
                        </p>
                    </div>
                ))}
            </div>

            {/* CTA: Invite to Write Testimonial */}
            <div className="mt-4 p-4 bg-sky-50 rounded-xl border border-sky-200 text-center">
                <p className="text-sm text-sky-800 mb-3 font-medium">
                    <i className="fa-solid fa-bullhorn mr-1.5"></i>
                    Pernah terlibat dalam kegiatan ini? Bagikan pengalaman Anda!
                </p>
                <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 text-white text-sm font-semibold rounded-lg hover:from-sky-700 hover:to-sky-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    <i className="fa-solid fa-pen-to-square text-sm"></i>
                    Tulis Testimoni
                </button>
            </div>

            {/* Testimonial Form Modal */}
            {isFormOpen && (
                <TestimonialForm onClose={() => setIsFormOpen(false)} />
            )}
        </div>
    );
}
