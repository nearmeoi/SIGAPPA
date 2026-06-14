import React from 'react';
import type { FeedbackDialogProps } from '@/types';
import SuccessView from '@/Components/ui/SuccessView';

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

    const bgColor = 'bg-white';
    const borderColor = 'border-slate-200';
    const buttonColor = type === 'success'
        ? 'bg-poltekpar-primary hover:bg-poltekpar-navy focus:ring-poltekpar-primary'
        : 'bg-red-500 hover:bg-red-600 focus:ring-red-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-live="polite">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Dialog */}
            <div className={`relative ${bgColor} rounded-[2rem] shadow-2xl border ${borderColor} p-8 max-w-sm w-full animate-in zoom-in-95 duration-200 overflow-hidden`}>
                {/* Decoration Background Circle */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full ${type === 'success' ? 'bg-emerald-50' : 'bg-red-50'} opacity-50`}></div>

                {type === 'success' ? (
                    <SuccessView
                        title={title || ''}
                        description={message || ''}
                        buttonLabel={actionLabel}
                        onButtonClick={onClose}
                    />
                ) : (
                    <>
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6 relative z-10">
                            <div className={`w-20 h-20 rounded-full bg-white flex items-center justify-center`}>
                                <i className={`${iconClass} text-4xl`}></i>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center mb-8 relative z-10">
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed px-2 font-medium">{message}</p>
                        </div>

                        {/* Action Button */}
                        <button
                            type="button"
                            className={`w-full py-4 ${buttonColor} text-white font-bold rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 relative z-10`}
                            onClick={onClose}
                        >
                            {actionLabel}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
