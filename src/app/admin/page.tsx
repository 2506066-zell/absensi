'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { showToast } from '@/components/Toast';
import { Class, AttendanceStatus, SessionPayload } from '@/types';
import { STATUS_OPTIONS } from '@/config';

interface AttendanceRow {
    id: number;
    student_id: number;
    class_id: number;
    teacher_id: number;
    date: string;
    status: AttendanceStatus;
    student_name: string;
    class_name: string;
    teacher_name: string;
}

export default function AdminPage() {
    const [records, setRecords] = useState<AttendanceRow[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [user, setUser] = useState<SessionPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(
        () => new Date().toISOString().split('T')[0]
    );
    const [filterClass, setFilterClass] = useState('');
    const router = useRouter();

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterDate) params.set('date', filterDate);
            if (filterClass) params.set('class_id', filterClass);

            const res = await fetch(`/api/attendance?${params.toString()}`);
            const data = await res.json();
            if (data.success) setRecords(data.data);
        } catch {
            showToast('Gagal memuat data', 'error');
        } finally {
            setLoading(false);
        }
    }, [filterDate, filterClass]);

    const fetchClasses = useCallback(async () => {
        try {
            const res = await fetch('/api/classes');
            const data = await res.json();
            if (data.success) setClasses(data.data);
        } catch {
            // silently fail
        }
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.success) setUser(data.data);
        } catch {
            // silently fail
        }
    }, []);

    useEffect(() => {
        fetchClasses();
        fetchCurrentUser();
    }, [fetchClasses, fetchCurrentUser]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    function getSummary() {
        const summary = { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: records.length };
        records.forEach((r) => {
            if (r.status in summary) {
                summary[r.status as keyof Omit<typeof summary, 'total'>]++;
            }
        });
        return summary;
    }

    function handleExport() {
        const params = new URLSearchParams();
        if (filterDate) params.set('date', filterDate);
        if (filterClass) params.set('class_id', filterClass);
        window.open(`/api/attendance/export?${params.toString()}`, '_blank');
    }

    const summary = getSummary();
    const statusLabel = (status: AttendanceStatus) =>
        STATUS_OPTIONS.find((o) => o.value === status)?.label || status;

    const statusBadgeColor: Record<AttendanceStatus, string> = {
        hadir: 'bg-emerald-100 text-emerald-700',
        izin: 'bg-amber-100 text-amber-700',
        sakit: 'bg-blue-100 text-blue-700',
        alpha: 'bg-rose-100 text-rose-700',
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar title="Rekap Absensi" showBack />

            <main className="max-w-lg mx-auto px-4 py-4">
                {user?.role === 'admin' && (
                    <div className="mb-4">
                        <button
                            onClick={() => router.push('/admin/manage')}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Kelola Kelas dan Siswa
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Filter by date"
                    />
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Filter by class"
                    >
                        <option value="">Semua Kelas</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {[
                        { label: 'Total', count: summary.total, color: 'text-slate-600 bg-slate-100' },
                        { label: 'Hadir', count: summary.hadir, color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Izin', count: summary.izin, color: 'text-amber-600 bg-amber-50' },
                        { label: 'Sakit', count: summary.sakit, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Alpha', count: summary.alpha, color: 'text-rose-600 bg-rose-50' },
                    ].map((item) => (
                        <div key={item.label} className={`${item.color} rounded-xl p-2.5 text-center`}>
                            <p className="text-lg font-bold">{item.count}</p>
                            <p className="text-[10px] font-medium">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Export Button */}
                <button
                    onClick={handleExport}
                    className="w-full mb-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    aria-label="Export to CSV"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                    Export CSV
                </button>

                {/* Records Table */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-slate-100">
                                <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                                <div className="h-3 bg-slate-100 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-400 text-sm">Tidak ada data absensi</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-slate-800 truncate">
                                        {record.student_name}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {record.class_name} - {record.date}
                                    </p>
                                </div>
                                <span
                                    className={`${statusBadgeColor[record.status]} px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0`}
                                >
                                    {statusLabel(record.status)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
