import React from 'react';

interface SuccessViewProps {
    title: string;
    description: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    iconSrc?: string;
    delay?: string;
    iconSize?: string;
}

const SuccessView: React.FC<SuccessViewProps> = ({
    title,
    description,
    buttonLabel,
    onButtonClick,
    iconSrc = "https://cdn.lordicon.com/egiwmiit.json",
    delay = "500",
    iconSize = "80px"
}) => {
    return (
        <div className="text-center animate-in zoom-in-95 duration-500">
            {/* Icon Container - No ring, no shadow, clean white bg */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
                {/* @ts-ignore */}
                <lord-icon
                    src={iconSrc}
                    trigger="loop"
                    delay={delay}
                    colors="primary:#10b981,secondary:#10b981"
                    style={{ width: iconSize, height: iconSize }}
                />
            </div>

            {/* Title - 12px (mb-3) spacing below */}
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                {title}
            </h2>

            {/* Description - 32px (mb-8) spacing below */}
            <p className="text-slate-500 font-bold mb-8 max-w-sm mx-auto leading-relaxed">
                {description}
            </p>

            {/* Optional Action Button - Soft shadow-md */}
            {buttonLabel && onButtonClick && (
                <button
                    type="button"
                    onClick={onButtonClick}
                    className="px-8 py-3 bg-poltekpar-primary text-white rounded-2xl font-black text-sm shadow-md shadow-poltekpar-primary/10 hover:bg-poltekpar-navy transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                >
                    {buttonLabel}
                </button>
            )}
        </div>
    );
};

export default SuccessView;
