'use client';

import { AttendanceStatus } from '@/types';
import { STATUS_OPTIONS } from '@/config';

interface StatusButtonProps {
    status: AttendanceStatus;
    isActive: boolean;
    onChange: (status: AttendanceStatus) => void;
    disabled?: boolean;
}

export default function StatusButton({
    status,
    isActive,
    onChange,
    disabled = false,
}: StatusButtonProps) {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    if (!option) return null;

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(status)}
            aria-label={`Mark as ${option.label}`}
            aria-pressed={isActive}
            className={`
        relative px-3 py-2.5 rounded-xl text-xs font-semibold
        transition-all duration-200 ease-out
        min-w-[60px] touch-manipulation select-none
        ${isActive
                    ? `${option.bgColor} ${option.color} ${option.borderColor} border-2 shadow-sm scale-105`
                    : 'bg-slate-100 text-slate-400 border-2 border-transparent hover:bg-slate-200'
                }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
      `}
        >
            {isActive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-current rounded-full border-2 border-white" />
            )}
            {option.label}
        </button>
    );
}
