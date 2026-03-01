'use client';

import { useEffect, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
    id: number;
    message: string;
    type: ToastType;
}

let toastId = 0;
const listeners: Set<(toast: ToastData) => void> = new Set();

export function showToast(message: string, type: ToastType = 'info') {
    const toast: ToastData = { id: ++toastId, message, type };
    listeners.forEach((fn) => fn(toast));
}

export default function Toast() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback((toast: ToastData) => {
        setToasts((prev) => [...prev, toast]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 3500);
    }, []);

    useEffect(() => {
        listeners.add(addToast);
        return () => {
            listeners.delete(addToast);
        };
    }, [addToast]);

    const colorMap: Record<ToastType, string> = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        info: 'bg-blue-500',
    };

    const iconMap: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    };

    return (
        <div
            className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
            ${colorMap[toast.type]} text-white px-4 py-3 rounded-xl shadow-2xl
            flex items-center gap-3 min-w-[280px] max-w-[360px]
            pointer-events-auto
            animate-[slideIn_0.3s_ease-out]
          `}
                    role="alert"
                >
                    <span className="text-lg font-bold flex-shrink-0">{iconMap[toast.type]}</span>
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
            ))}
        </div>
    );
}
