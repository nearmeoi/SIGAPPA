import { useMemo } from 'react';
import type { PkmData } from '@/types';
import { resolvePublicPkmData, resolveUserPkmData } from '@/data/sigapData';

export type PkmDataResolutionType = 'public' | 'user';

interface UsePkmDataOptions {
    type?: PkmDataResolutionType;
    serverData?: PkmData[] | null;
}

/**
 * Custom hook untuk menyelesaikan dan memproses data PKM
 * Menyediakan statistik dan filtering status otomatis
 * 
 * @param options Konfigurasi tipe resolusi dan data server
 */
export function usePkmData(options: UsePkmDataOptions = { type: 'public' }) {
    const { type, serverData } = options;

    const data = useMemo(() => {
        if (type === 'user') {
            return resolveUserPkmData(serverData);
        }
        return resolvePublicPkmData(serverData);
    }, [type, serverData]);

    const stats = useMemo(() => {
        const total = data.length;
        const active = data.filter(d => d.status === 'berlangsung').length;
        const completed = data.filter(d => d.status === 'selesai').length;
        
        return { total, active, completed };
    }, [data]);

    const activeList = useMemo(() => data.filter(d => d.status === 'berlangsung'), [data]);
    const completedList = useMemo(() => data.filter(d => d.status === 'selesai'), [data]);

    return {
        data,
        stats,
        activeList,
        completedList
    };
}
