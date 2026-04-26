import React, { useEffect } from 'react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Ya, Lanjutkan',
    cancelLabel = 'Batal',
    variant = 'danger',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onCancel]);

    if (!open) return null;

    const colors = {
        danger: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', btn: '#dc2626', btnHover: '#b91c1c', iconBg: '#fee2e2', iconColor: '#dc2626' },
        warning: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', btn: '#f59e0b', btnHover: '#d97706', iconBg: '#fef3c7', iconColor: '#b45309' },
        info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', btn: '#2563eb', btnHover: '#1E4A8C', iconBg: '#dbeafe', iconColor: '#2563eb' },
    }[variant];

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
            }}
        >
            {/* Backdrop */}
            <div
                onClick={onCancel}
                style={{
                    position: 'absolute', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.15s ease',
                }}
            />

            {/* Dialog */}
            <div
                style={{
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                    maxWidth: '400px',
                    width: '100%',
                    padding: '28px',
                    animation: 'slideUp 0.2s ease',
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        backgroundColor: colors.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '16px',
                    }}
                >
                    <i
                        className={variant === 'danger' ? 'fa-solid fa-triangle-exclamation' : variant === 'warning' ? 'fa-solid fa-circle-question' : 'fa-solid fa-circle-info'}
                        style={{ fontSize: '20px', color: colors.iconColor }}
                    />
                </div>

                {/* Text */}
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5, fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {message}
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: '10px',
                            border: '1px solid #e2e8f0', backgroundColor: 'white',
                            color: '#475569', fontSize: '13px', fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            transition: 'all 0.15s',
                            opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'white'; }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: '10px',
                            border: 'none', backgroundColor: colors.btn,
                            color: 'white', fontSize: '13px', fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: loading ? 0.7 : 1,
                        }}
                        onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.backgroundColor = colors.btnHover; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = colors.btn; }}
                    >
                        {loading && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '13px' }} />}
                        {confirmLabel}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
}
