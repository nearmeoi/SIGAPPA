import React from 'react';
import type { FeedbackDialogProps } from '@/types';

interface ActionFeedbackDialogProps extends FeedbackDialogProps {
    onClose?: () => void;
    actionLabel?: string;
}

export default function ActionFeedbackDialog({
    show,
    type = 'success',
    title,
    message,
    onClose,
    actionLabel = 'Tutup',
}: ActionFeedbackDialogProps) {
    if (!show) {
        return null;
    }

    const iconClass = type === 'success' 
        ? 'fa-solid fa-circle-check text-emerald-500' 
        : 'fa-solid fa-circle-exclamation text-red-500';

    const bgColor = type === 'success' ? 'bg-emerald-50' : 'bg-red-50';
    const borderColor = type === 'success' ? 'border-emerald-200' : 'border-red-200';
    const buttonColor = type === 'success' 
        ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500' 
        : 'bg-red-500 hover:bg-red-600 focus:ring-red-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-live="polite">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose}></div>
            
            {/* Dialog */}
            <div className={`relative ${bgColor} rounded-2xl shadow-xl border ${borderColor} p-6 max-w-sm w-full animate-in zoom-in-95 duration-200`}>
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center ${type === 'success' ? 'ring-4 ring-emerald-100' : 'ring-4 ring-red-100'}`}>
                        <i className={`${iconClass} text-3xl`}></i>
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-600 leading-relaxed">{message}</p>
                </div>

                {/* Action Button */}
                <button 
                    type="button" 
                    className={`w-full py-3.5 ${buttonColor} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`} 
                    onClick={onClose}
                >
                    {actionLabel}
                </button>
            </div>
        </div>
    );
}
