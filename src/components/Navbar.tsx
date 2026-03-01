'use client';

import { useRouter } from 'next/navigation';

interface NavbarProps {
    title: string;
    showBack?: boolean;
    userName?: string;
    onLogout?: () => void;
}

export default function Navbar({
    title,
    showBack = false,
    userName,
    onLogout,
}: NavbarProps) {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
            <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
                            aria-label="Go back"
                        >
                            <svg
                                className="w-5 h-5 text-slate-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                    )}
                    <h1 className="text-lg font-bold text-slate-800 truncate">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    {userName && (
                        <span className="text-xs font-medium text-slate-500 hidden sm:block">
                            {userName}
                        </span>
                    )}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                            aria-label="Logout"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
