import React from 'react';
import { Link } from '@inertiajs/react';

interface LinkItem {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: LinkItem[];
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ links, className = '' }) => {
    // If only one page (prev and next links only, or just one page link), hide pagination
    if (links.length <= 3) return null;

    return (
        <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
            {links.map((link, key) => {
                const isPrev = link.label.includes('Previous');
                const isNext = link.label.includes('Next');
                
                let label = link.label;
                if (isPrev) label = 'Sebelumnya';
                if (isNext) label = 'Selanjutnya';

                if (link.url === null) {
                    return (
                        <div
                            key={key}
                            className="px-4 py-2 text-[13px] font-bold text-slate-300 bg-white border border-slate-100 rounded-xl cursor-not-allowed"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }

                return (
                    <Link
                        key={key}
                        href={link.url}
                        className={`px-4 py-2 text-[13px] font-bold rounded-xl border transition-all duration-200 ${
                            link.active
                                ? 'bg-poltekpar-primary text-white border-poltekpar-primary shadow-lg shadow-poltekpar-primary/20'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-poltekpar-primary/30 hover:bg-slate-50'
                        }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </div>
    );
};

export default Pagination;
