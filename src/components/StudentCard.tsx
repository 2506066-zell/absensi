'use client';

import { StudentWithAttendance, AttendanceStatus } from '@/types';
import StatusButton from './StatusButton';

interface StudentCardProps {
    student: StudentWithAttendance;
    onStatusChange: (studentId: number, status: AttendanceStatus) => void;
    disabled?: boolean;
}

export default function StudentCard({
    student,
    onStatusChange,
    disabled = false,
}: StudentCardProps) {
    const statuses: AttendanceStatus[] = ['hadir', 'izin', 'sakit', 'alpha'];

    return (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                        <p className="text-xs text-slate-400">ID: {student.id}</p>
                    </div>
                </div>
                <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label={`Attendance status for ${student.name}`}>
                    {statuses.map((status) => (
                        <StatusButton
                            key={status}
                            status={status}
                            isActive={student.status === status}
                            onChange={(s) => onStatusChange(student.id, s)}
                            disabled={disabled}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
