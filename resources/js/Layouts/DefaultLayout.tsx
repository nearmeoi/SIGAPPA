import React from 'react';
import Navbar from '@/Components/Navbar';
import Footer from '@/Components/Footer';
import { Link, usePage } from '@inertiajs/react';

interface DefaultLayoutProps {
    children: React.ReactNode;
    mainClassName?: string;
    mainStyle?: React.CSSProperties;
}

export default function DefaultLayout({ children, mainClassName = 'site-main-content', mainStyle }: DefaultLayoutProps) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;
    const isMasyarakat = !user || user.role === 'masyarakat';

    return (
        <div className="layout-wrapper min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Navbar />
            <main className={`flex-1 ${mainClassName}`} style={mainStyle}>
                {children}
            </main>
            
            {/* Floating Feedback Button for Public/Masyarakat */}
            {isMasyarakat && (
                <Link
                    href="/evaluasi"
                    className="fixed bottom-24 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-poltekpar-primary text-white shadow-lg hover:bg-poltekpar-navy transition-all hover:shadow-xl z-40 group"
                    title="Beri Masukan / Feedback"
                >
                    <i className="fa-solid fa-star text-lg group-hover:scale-110 transition-transform"></i>
                    <span className="absolute right-full mr-3 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        Feedback
                    </span>
                </Link>
            )}

            <Footer />
        </div>
    );
}
