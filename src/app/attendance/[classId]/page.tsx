'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StudentCard from '@/components/StudentCard';
import StickyBar from '@/components/StickyBar';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { showToast } from '@/components/Toast';
import { StudentWithAttendance, AttendanceStatus, Class } from '@/types';
import { savePendingAttendance, syncPendingAttendance } from '@/lib/api/offlineQueue';

export default function AttendancePage() {
    const params = useParams();
    const classId = Number(params.classId);

    const [students, setStudents] = useState<StudentWithAttendance[]>([]);
    const [classInfo, setClassInfo] = useState<Class | null>(null);
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/classes/${classId}/students?date=${date}`);
            const data = await res.json();
            if (data.success) {
                setStudents(data.data);
            }
        } catch {
            showToast('Gagal memuat data siswa', 'error');
        } finally {
            setLoading(false);
        }
    }, [classId, date]);

    const fetchClassInfo = useCallback(async () => {
        try {
            const res = await fetch('/api/classes');
            const data = await res.json();
            if (data.success) {
                const cls = data.data.find((c: Class) => c.id === classId);
                if (cls) setClassInfo(cls);
            }
        } catch {
            // silently fail
        }
    }, [classId]);

    useEffect(() => {
        fetchStudents();
        fetchClassInfo();
    }, [fetchStudents, fetchClassInfo]);

    // Sync pending records when coming online
    useEffect(() => {
        async function handleOnline() {
            const synced = await syncPendingAttendance();
            if (synced > 0) {
                showToast(`${synced} data pending berhasil disinkronkan`, 'success');
                fetchStudents();
            }
        }

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [fetchStudents]);

    function handleStatusChange(studentId: number, status: AttendanceStatus) {
        setStudents((prev) =>
            prev.map((s) =>
                s.id === studentId ? { ...s, status } : s
            )
        );
    }

    async function handleSave() {
        if (students.length === 0) {
            showToast('Tidak ada siswa di kelas ini', 'error');
            return;
        }

        const unmarked = students.filter((s) => !s.status);
        if (unmarked.length > 0) {
            showToast(`Absensi belum lengkap, ${unmarked.length} siswa belum dipilih`, 'error');
            return;
        }

        const records = students.map((s) => ({
            student_id: s.id,
            class_id: classId,
            status: s.status as AttendanceStatus,
            date,
        }));

        setSaving(true);

        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records }),
            });

            const data = await res.json();

            if (data.success) {
                showToast(`Absensi ${records.length} siswa berhasil disimpan!`, 'success');
                fetchStudents();
            } else {
                showToast(data.error || 'Gagal menyimpan absensi', 'error');
            }
        } catch {
            // Offline - save to IndexedDB
            try {
                await savePendingAttendance(records);
                showToast('Disimpan offline. Akan disinkronkan saat online.', 'info');
            } catch {
                showToast('Gagal menyimpan data', 'error');
            }
        } finally {
            setSaving(false);
        }
    }

    function markAllAs(status: AttendanceStatus) {
        setStudents((prev) => prev.map((s) => ({ ...s, status })));
    }

    const markedCount = students.filter((s) => s.status).length;
    const totalStudents = students.length;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <Navbar
                title={classInfo?.name || `Kelas ${classId}`}
                showBack
            />

            <main className="max-w-lg mx-auto px-4 py-4">
                {/* Date & Quick Actions */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        aria-label="Select date"
                    />
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => markAllAs('hadir')}
                            className="px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                            Semua Hadir
                        </button>
                        <button
                            onClick={() => markAllAs('alpha')}
                            className="px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                            Semua Alpha
                        </button>
                    </div>
                </div>

                {/* Summary Bar */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { label: 'Hadir', count: students.filter((s) => s.status === 'hadir').length, color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Izin', count: students.filter((s) => s.status === 'izin').length, color: 'text-amber-600 bg-amber-50' },
                        { label: 'Sakit', count: students.filter((s) => s.status === 'sakit').length, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Alpha', count: students.filter((s) => s.status === 'alpha').length, color: 'text-rose-600 bg-rose-50' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className={`${item.color} rounded-xl p-2.5 text-center`}
                        >
                            <p className="text-lg font-bold">{item.count}</p>
                            <p className="text-xs font-medium">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Student List */}
                {loading ? (
                    <LoadingSkeleton count={5} />
                ) : students.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400">Tidak ada siswa di kelas ini</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {students.map((student) => (
                            <StudentCard
                                key={student.id}
                                student={student}
                                onStatusChange={handleStatusChange}
                                disabled={saving}
                            />
                        ))}
                    </div>
                )}
            </main>

            <StickyBar
                onSave={handleSave}
                loading={saving}
                count={markedCount}
                total={totalStudents}
                disabled={totalStudents === 0 || markedCount !== totalStudents}
            />
        </div>
    );
}
