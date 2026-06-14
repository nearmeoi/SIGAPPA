import React, { useRef, useEffect, useState, ReactNode } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [dragging, setDragging] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartY(e.touches[0].clientY);
        setDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!dragging) return;
        const diff = e.touches[0].clientY - startY;
        if (diff > 0) {
            setCurrentY(diff);
            if (sheetRef.current) {
                sheetRef.current.style.transform = `translateY(${diff}px)`;
            }
        }
    };

    const handleTouchEnd = () => {
        setDragging(false);
        if (currentY > 120) {
            onClose();
        }
        setCurrentY(0);
        if (sheetRef.current) {
            sheetRef.current.style.transform = '';
        }
    };

    useEffect(() => {
        if (!isOpen && sheetRef.current) {
            sheetRef.current.style.transform = '';
        }
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div
                ref={sheetRef}
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 ease-out max-h-[90vh] flex flex-col ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                {/* Handle Area */}
                <div
                    className="flex items-center justify-center py-4 cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        <button
                            type="button"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                            onClick={onClose}
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-6 pb-6">
                    {children}
                </div>
            </div>
        </>
    );
}
