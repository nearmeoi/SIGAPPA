import React from 'react';
import { Skeleton } from './Skeleton';

export function SkeletonChart({ type = 'bar', className = '' }: { type?: 'bar' | 'pie' | 'map', className?: string }) {
    return (
        <div className={`flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 ${className}`}>
            <div className="flex w-full justify-between pb-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
            </div>
            
            <div className="flex min-h-[300px] w-full items-end justify-between gap-2 overflow-hidden px-2 pt-8">
                {type === 'bar' && Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton 
                        key={i} 
                        className="w-full rounded-t-md" 
                        style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
                    />
                ))}
                
                {type === 'pie' && (
                    <div className="flex w-full items-center justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                    </div>
                )}

                {type === 'map' && (
                     <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-slate-100">
                        <Skeleton className="h-full w-full opacity-50" />
                    </div>
                )}
            </div>
        </div>
    );
}
