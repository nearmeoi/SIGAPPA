import React from 'react';
import { Skeleton } from './Skeleton';

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 6 }: SkeletonTableProps) {
    return (
        <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            {[...Array(columns)].map((_, i) => (
                                <th key={i} className="py-3 px-4">
                                    <Skeleton className="h-4 w-20" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[...Array(rows)].map((_, i) => (
                            <tr key={i}>
                                {[...Array(columns)].map((_, j) => (
                                    <td key={j} className="py-4 px-4">
                                        <Skeleton className={j === 0 ? "h-5 w-32" : "h-4 w-24"} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
