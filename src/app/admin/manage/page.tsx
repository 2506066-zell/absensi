'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { showToast } from '@/components/Toast';
import { Class, SessionPayload, StudentWithAttendance } from '@/types';

export default function ManagePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [user, setUser] = useState<SessionPayload | null>(null);
    const [addingClass, setAddingClass] = useState(false);
    const [addingStudent, setAddingStudent] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [classStudents, setClassStudents] = useState<StudentWithAttendance[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [studentClassId, setStudentClassId] = useState('');
    const [newStudentName, setNewStudentName] = useState('');
    const router = useRouter();

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
        if (classes.length > 0 && !studentClassId) {
            setStudentClassId(String(classes[0].id));
        }
    }, [classes, studentClassId]);

    useEffect(() => {
        void fetchClassStudents(studentClassId);
    }, [studentClassId, fetchClassStudents]);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.replace('/admin');
        }
    }, [user, router]);

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

    if (user && user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar title="Kelola Kelas & Siswa" showBack />

            <main className="max-w-lg mx-auto px-4 py-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800">Manajemen Data</h2>

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
                                disabled={classes.length === 0}
                            >
                                <option value="">Pilih kelas</option>
                                {classes.map((c) => (
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
                                disabled={classes.length === 0}
                            />
                            <button
                                type="submit"
                                disabled={addingStudent || classes.length === 0}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {addingStudent ? 'Menyimpan...' : 'Tambah'}
                            </button>
                        </div>
                        {classes.length === 0 && (
                            <p className="text-xs text-slate-400">
                                Buat kelas terlebih dahulu untuk menambahkan siswa.
                            </p>
                        )}
                    </form>

                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-slate-600">Daftar Siswa Kelas</h3>
                            <span className="text-xs text-slate-400">{classStudents.length} siswa</span>
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
            </main>
        </div>
    );
}
