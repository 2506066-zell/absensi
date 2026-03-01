import { AttendanceStatus } from '@/types';

export const APP_NAME = 'Absensi';
export const APP_DESCRIPTION = 'Sistem Absensi Siswa';

export const STATUS_OPTIONS: {
    value: AttendanceStatus;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
}[] = [
        {
            value: 'hadir',
            label: 'Hadir',
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-500',
        },
        {
            value: 'izin',
            label: 'Izin',
            color: 'text-amber-700',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-500',
        },
        {
            value: 'sakit',
            label: 'Sakit',
            color: 'text-blue-700',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-500',
        },
        {
            value: 'alpha',
            label: 'Alpha',
            color: 'text-rose-700',
            bgColor: 'bg-rose-50',
            borderColor: 'border-rose-500',
        },
    ];

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
    hadir: '#10b981',
    izin: '#f59e0b',
    sakit: '#3b82f6',
    alpha: '#f43f5e',
};

export const COOKIE_NAME = 'absensi_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
