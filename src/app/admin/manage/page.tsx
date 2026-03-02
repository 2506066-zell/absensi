'use client';

import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { showToast } from '@/components/Toast';
import { Class, SessionPayload, StudentWithAttendance } from '@/types';

interface ImportResult {
    inserted: number;
    skipped: number;
    invalid_rows: number;
    total_rows: number;
}

export default function ManagePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [user, setUser] = useState<SessionPayload | null>(null);
    const [addingClass, setAddingClass] = useState(false);
    const [addingStudent, setAddingStudent] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [importingStudents, setImportingStudents] = useState(false);
    const [downloadingBackup, setDownloadingBackup] = useState(false);

    const [classStudents, setClassStudents] = useState<StudentWithAttendance[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [studentClassId, setStudentClassId] = useState('');
    const [newStudentName, setNewStudentName] = useState('');

    const [editingClassId, setEditingClassId] = useState<number | null>(null);
    const [editingClassName, setEditingClassName] = useState('');
    const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
    const [editingStudentName, setEditingStudentName] = useState('');

    const router = useRouter();

    const fetchClasses = useCallback(async () => {
        try {
            const res = await fetch('/api/classes');
            const data = await res.json();
            if (data.success) setClasses(data.data);
        } catch {
            showToast('Gagal memuat kelas', 'error');
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

    function startEditClass(cls: Class) {
        setEditingClassId(cls.id);
        setEditingClassName(cls.name);
    }

    async function saveEditClass(classId: number) {
        const nextName = editingClassName.trim();
        if (!nextName) {
            showToast('Nama kelas wajib diisi', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/classes/${classId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nextName }),
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Gagal mengubah kelas', 'error');
                return;
            }

            showToast('Kelas berhasil diubah', 'success');
            setEditingClassId(null);
            setEditingClassName('');
            await fetchClasses();
            await fetchClassStudents(studentClassId);
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        }
    }

    async function handleDeleteClass(cls: Class) {
        const ok = window.confirm(`Hapus kelas ${cls.name}? Semua siswa dan absensi kelas ini ikut terhapus.`);
        if (!ok) return;

        try {
            const res = await fetch(`/api/classes/${cls.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Gagal menghapus kelas', 'error');
                return;
            }

            showToast('Kelas berhasil dihapus', 'success');
            await fetchClasses();

            if (studentClassId === String(cls.id)) {
                setStudentClassId('');
                setClassStudents([]);
            }
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        }
    }

    function startEditStudent(student: StudentWithAttendance) {
        setEditingStudentId(student.id);
        setEditingStudentName(student.name);
    }

    async function saveEditStudent(studentId: number) {
        const nextName = editingStudentName.trim();
        if (!nextName) {
            showToast('Nama siswa wajib diisi', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/students/${studentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nextName }),
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Gagal mengubah siswa', 'error');
                return;
            }

            showToast('Siswa berhasil diubah', 'success');
            setEditingStudentId(null);
            setEditingStudentName('');
            await fetchClassStudents(studentClassId);
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        }
    }

    async function handleDeleteStudent(student: StudentWithAttendance) {
        const ok = window.confirm(`Hapus siswa ${student.name}? Data absensinya juga ikut terhapus.`);
        if (!ok) return;

        try {
            const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Gagal menghapus siswa', 'error');
                return;
            }

            showToast('Siswa berhasil dihapus', 'success');
            await fetchClassStudents(studentClassId);
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        }
    }

    async function handleImportStudents(e: ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const classId = Number(studentClassId);
        if (!classId) {
            showToast('Pilih kelas terlebih dahulu', 'error');
            e.target.value = '';
            return;
        }

        setImportingStudents(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const res = await fetch(`/api/classes/${classId}/students/import`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Gagal import siswa', 'error');
                return;
            }

            const result = data.data as ImportResult;
            showToast(
                `Import selesai: ${result.inserted} masuk, ${result.skipped} duplikat, ${result.invalid_rows} invalid`,
                'success'
            );
            await fetchClassStudents(studentClassId);
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        } finally {
            setImportingStudents(false);
            e.target.value = '';
        }
    }

    async function handleDownloadBackup() {
        setDownloadingBackup(true);
        try {
            const res = await fetch('/api/backup/export');
            if (!res.ok) {
                const data = await res.json();
                showToast(data.error || 'Gagal download backup', 'error');
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `absensi_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('Backup berhasil didownload', 'success');
        } catch {
            showToast('Tidak dapat terhubung ke server', 'error');
        } finally {
            setDownloadingBackup(false);
        }
    }

    if (user && user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar title="Kelola Kelas & Siswa" showBack />

            <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <button
                        onClick={handleDownloadBackup}
                        disabled={downloadingBackup}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                        {downloadingBackup ? 'Menyiapkan backup...' : 'Download Backup Data (JSON)'}
                    </button>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800">Kelas</h2>

                    <form onSubmit={handleAddClass} className="flex gap-2">
                        <input
                            id="new-class"
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="Nama kelas baru"
                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            maxLength={100}
                        />
                        <button
                            type="submit"
                            disabled={addingClass}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300"
                        >
                            {addingClass ? 'Menyimpan...' : 'Tambah'}
                        </button>
                    </form>

                    <div className="space-y-2">
                        {classes.length === 0 ? (
                            <p className="text-sm text-slate-400">Belum ada kelas.</p>
                        ) : (
                            classes.map((cls) => (
                                <div key={cls.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50">
                                    {editingClassId === cls.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                value={editingClassName}
                                                onChange={(e) => setEditingClassName(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                                maxLength={100}
                                            />
                                            <button
                                                onClick={() => saveEditClass(cls.id)}
                                                className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                                            >
                                                Simpan
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingClassId(null);
                                                    setEditingClassName('');
                                                }}
                                                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-semibold text-sm text-slate-800">{cls.name}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEditClass(cls)}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClass(cls)}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-100 text-rose-700"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800">Siswa</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
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
                        <label className="px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-center">
                            {importingStudents ? 'Importing...' : 'Import CSV/Excel'}
                            <input
                                type="file"
                                accept=".csv,.xls,.xlsx"
                                className="hidden"
                                onChange={handleImportStudents}
                                disabled={importingStudents || classes.length === 0 || studentClassId === ''}
                            />
                        </label>
                    </div>

                    <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                        <input
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="Nama siswa"
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            maxLength={100}
                            disabled={classes.length === 0 || studentClassId === ''}
                        />
                        <button
                            type="submit"
                            disabled={addingStudent || classes.length === 0 || studentClassId === ''}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300"
                        >
                            {addingStudent ? 'Menyimpan...' : 'Tambah Siswa'}
                        </button>
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
                            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                                {classStudents.map((student) => (
                                    <div key={student.id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                                        {editingStudentId === student.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    value={editingStudentName}
                                                    onChange={(e) => setEditingStudentName(e.target.value)}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                                    maxLength={100}
                                                />
                                                <button
                                                    onClick={() => saveEditStudent(student.id)}
                                                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                                                >
                                                    Simpan
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingStudentId(null);
                                                        setEditingStudentName('');
                                                    }}
                                                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm text-slate-700">{student.name}</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditStudent(student)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStudent(student)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-100 text-rose-700"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
