import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon: string;
    href?: string;
}

interface MobileTabBarProps {
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
}

export default function MobileTabBar({ activeTab = 'peta', onTabChange }: MobileTabBarProps) {
    const tabs: Tab[] = [
        { id: 'beranda', label: 'Beranda', icon: 'fa-solid fa-house', href: 'https://p3m.poltekparmakassar.ac.id/' },
        { id: 'peta', label: 'Peta', icon: 'fa-solid fa-map-location-dot' },
        { id: 'dashboard', label: 'Statistik', icon: 'fa-solid fa-chart-pie' },
        { id: 'kegiatan', label: 'Kegiatan', icon: 'fa-solid fa-clipboard-list' },
        { id: 'akun', label: 'Akun', icon: 'fa-solid fa-user', href: '/login' },
    ];

    const handleTabClick = (tab: Tab) => {
        if (tab.href) {
            window.location.href = tab.href;
        } else {
            onTabChange?.(tab.id);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 safe-area-bottom">
            <div className="flex items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`flex flex-col items-center justify-center flex-1 py-3 px-2 transition-all duration-200 ${
                                isActive
                                    ? 'text-poltekpar-primary'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                            onClick={() => handleTabClick(tab)}
                        >
                            <div className={`relative w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`}>
                                <i className={`${tab.icon} text-lg absolute inset-0 flex items-center justify-center`}></i>
                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-poltekpar-primary"></span>
                                )}
                            </div>
                            <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
