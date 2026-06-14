import React, { useEffect } from 'react';

interface ToastProps {
    show: boolean;
    type?: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onClose: () => void;
    duration?: number;
}

export default function Toast({
    show,
    type = 'success',
    title,
    message,
    onClose,
    duration = 3000,
}: ToastProps) {
    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    const iconClass = type === 'success' 
        ? 'fa-solid fa-circle-check text-emerald-500' 
        : type === 'info'
        ? 'fa-solid fa-bell text-blue-500'
        : 'fa-solid fa-circle-exclamation text-red-500';

    const bgColor = type === 'success' ? 'bg-emerald-50' : type === 'info' ? 'bg-blue-50' : 'bg-red-50';
    const borderColor = type === 'success' ? 'border-emerald-200' : type === 'info' ? 'border-blue-200' : 'border-red-200';
    const ringColor = type === 'success' ? 'ring-emerald-100' : type === 'info' ? 'ring-blue-100' : 'ring-red-100';

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-4 px-6 py-4 rounded-xl shadow-lg border transition-all duration-300 transform ${bgColor} ${borderColor} ${
                show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
            }`}
        >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow ring-4 ${ringColor}`}>
                <i className={`${iconClass} text-xl`}></i>
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-base">{title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
            </div>
            
            <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                onClick={onClose}
                aria-label="Tutup"
            >
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
    );
}
