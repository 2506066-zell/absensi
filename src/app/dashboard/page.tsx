'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { showToast } from '@/components/Toast';
import { Class, SessionPayload } from '@/types';

export default function DashboardPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [user, setUser] = useState<SessionPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            const [classesRes, userRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/auth/me'),
            ]);

            const classesData = await classesRes.json();
            const userData = await userRes.json();

            if (classesData.success) setClasses(classesData.data);
            if (userData.success) setUser(userData.data);
        } catch {
            showToast('Gagal memuat data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    }

    const classIcons = ['📚', '📖', '📝', '🎓', '✏️', '🏫'];

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar
                title="Dashboard"
                userName={user?.name}
                onLogout={handleLogout}
            />

            <main className="max-w-lg mx-auto px-4 py-6">
                {/* Greeting */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800">
                        Selamat datang{user ? `, ${user.name}` : ''}! 👋
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Pilih kelas untuk memulai absensi hari ini
                    </p>
                </div>

                {/* Date Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-6 text-white shadow-lg shadow-indigo-500/25">
                    <p className="text-xs font-medium text-indigo-200">Tanggal Hari Ini</p>
                    <p className="text-lg font-bold mt-1">
                        {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-5 h-36 animate-pulse border border-slate-100"
                            >
                                <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-3" />
                                <div className="h-4 bg-slate-200 rounded-lg w-24" />
                                <div className="h-3 bg-slate-100 rounded-lg w-16 mt-2" />
                            </div>
                        ))}
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400">Belum ada kelas tersedia</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {classes.map((cls, index) => (
                            <button
                                key={cls.id}
                                onClick={() => router.push(`/attendance/${cls.id}`)}
                                className="bg-white rounded-2xl p-5 text-left border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-200 active:scale-[0.97] group"
                                aria-label={`Go to ${cls.name}`}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                                    {classIcons[index % classIcons.length]}
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">{cls.name}</h3>
                            </button>
                        ))}
                    </div>
                )}

                {/* Quick Links */}
                <div className="mt-8">
                    <button
                        onClick={() => router.push('/admin')}
                        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Lihat Rekap Absensi
                    </button>
                </div>
            </main>
        </div>
    );
}
