'use client';

interface StickyBarProps {
    onSave: () => void;
    loading: boolean;
    disabled?: boolean;
    count?: number;
}

export default function StickyBar({
    onSave,
    loading,
    disabled = false,
    count = 0,
}: StickyBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 px-4 py-3 safe-area-bottom">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{count}</span> siswa
                </p>
                <button
                    onClick={onSave}
                    disabled={loading || disabled}
                    className={`
            px-8 py-3 rounded-2xl font-semibold text-sm
            transition-all duration-200 ease-out
            shadow-lg shadow-indigo-500/25
            ${loading || disabled
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95'
                        }
          `}
                    aria-label="Save attendance"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Menyimpan...
                        </span>
                    ) : (
                        'Simpan Absen'
                    )}
                </button>
            </div>
        </div>
    );
}
