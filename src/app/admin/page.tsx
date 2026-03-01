'use client';

import { useState, useEffect, useCallback, FormEvent, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { showToast } from '@/components/Toast';
import { Class, AttendanceStatus, SessionPayload, StudentWithAttendance } from '@/types';
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
    const [addingClass, setAddingClass] = useState(false);
    const [addingStudent, setAddingStudent] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [classStudents, setClassStudents] = useState<StudentWithAttendance[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [studentClassId, setStudentClassId] = useState('');
    const [newStudentName, setNewStudentName] = useState('');
    const [filterDate, setFilterDate] = useState(
        () => new Date().toISOString().split('T')[0]
    );
    const [filterClass, setFilterClass] = useState('');

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

    const fetchClassStudents = useCallback(async (classId: string) => {
        if (!classId) {
            setClassStudents([]);
            return;
        }

        setLoadingStudents(true);
        try {
            const res = await fetch(`/api/classes/${classId}/students`);
            const data = await res.json();
            if (data.success) {
                setClassStudents(data.data);
            } else {
                setClassStudents([]);
            }
        } catch {
            setClassStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
        fetchCurrentUser();
    }, [fetchClasses, fetchCurrentUser]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const ownClasses = useMemo(
        () => (user ? classes.filter((cls) => cls.teacher_id === user.id) : []),
        [classes, user]
    );

    useEffect(() => {
        if (!studentClassId && ownClasses.length > 0) {
            setStudentClassId(String(ownClasses[0].id));
        }
    }, [studentClassId, ownClasses]);

    useEffect(() => {
        void fetchClassStudents(studentClassId);
    }, [studentClassId, fetchClassStudents]);

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

    async function handleAddClass(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const className = newClassName.trim();
        if (!className) {
            showToast('Nama kelas wajib diisi', 'error');
            return;
        }

        setAddingClass(true);
        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: className }),
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Gagal menambah kelas', 'error');
                return;
            }

            setNewClassName('');
            showToast('Kelas berhasil ditambahkan', 'success');
            await fetchClasses();

            if (data.data?.id) {
                setStudentClassId(String(data.data.id));
            }
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        } finally {
            setAddingClass(false);
        }
    }

    async function handleAddStudent(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const classId = Number(studentClassId);
        const studentName = newStudentName.trim();

        if (!classId) {
            showToast('Pilih kelas terlebih dahulu', 'error');
            return;
        }
        if (!studentName) {
            showToast('Nama siswa wajib diisi', 'error');
            return;
        }

        setAddingStudent(true);
        try {
            const res = await fetch(`/api/classes/${classId}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName }),
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Gagal menambah siswa', 'error');
                return;
            }

            setNewStudentName('');
            showToast('Siswa berhasil ditambahkan', 'success');
            await fetchClassStudents(String(classId));
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        } finally {
            setAddingStudent(false);
        }
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
                {/* Class & Student Management */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800">Tambah Data</h2>

                    <form onSubmit={handleAddClass} className="space-y-2">
                        <label htmlFor="new-class" className="block text-xs font-semibold text-slate-600">
                            Tambah Kelas
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="new-class"
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="Contoh: Kelas 9A"
                                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                maxLength={100}
                            />
                            <button
                                type="submit"
                                disabled={addingClass}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {addingClass ? 'Menyimpan...' : 'Tambah'}
                            </button>
                        </div>
                    </form>

                    <form onSubmit={handleAddStudent} className="space-y-2">
                        <label htmlFor="student-class" className="block text-xs font-semibold text-slate-600">
                            Tambah Siswa
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                            <select
                                id="student-class"
                                value={studentClassId}
                                onChange={(e) => setStudentClassId(e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={ownClasses.length === 0}
                            >
                                <option value="">Pilih kelas</option>
                                {ownClasses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="Nama siswa"
                                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                maxLength={100}
                                disabled={ownClasses.length === 0}
                            />
                            <button
                                type="submit"
                                disabled={addingStudent || ownClasses.length === 0}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {addingStudent ? 'Menyimpan...' : 'Tambah'}
                            </button>
                        </div>
                        {ownClasses.length === 0 && (
                            <p className="text-xs text-slate-400">
                                Buat kelas terlebih dahulu untuk menambahkan siswa.
                            </p>
                        )}
                    </form>

                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-slate-600">Daftar Siswa Kelas</h3>
                            <span className="text-xs text-slate-400">
                                {classStudents.length} siswa
                            </span>
                        </div>
                        {studentClassId === '' ? (
                            <p className="text-xs text-slate-400">Pilih kelas untuk melihat daftar siswa.</p>
                        ) : loadingStudents ? (
                            <div className="space-y-1.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
                                ))}
                            </div>
                        ) : classStudents.length === 0 ? (
                            <p className="text-xs text-slate-400">Belum ada siswa di kelas ini.</p>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                {classStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700"
                                    >
                                        {student.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

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
