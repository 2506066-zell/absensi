import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/session';
import { query } from '@/lib/db';
import { writeAuditLog } from '@/lib/audit';
import {
    ApiResponse,
    AttendanceRecord,
    BackupPayload,
    Class,
    Student,
    Teacher,
} from '@/types';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }
        if (session.role !== 'admin') {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Admin only action' },
                { status: 403 }
            );
        }

        const [teachers, classes, students, attendance] = await Promise.all([
            query<Teacher>('SELECT id, name, email, role, created_at FROM teachers ORDER BY id'),
            query<Class>('SELECT id, name, teacher_id FROM classes ORDER BY id'),
            query<Student>('SELECT id, name, class_id FROM students ORDER BY id'),
            query<AttendanceRecord>(
                `SELECT id, student_id, class_id, teacher_id, date, status, created_at, updated_at
         FROM attendance
         ORDER BY date DESC, id`
            ),
        ]);

        const payload: BackupPayload = {
            generated_at: new Date().toISOString(),
            generated_by: {
                id: session.id,
                name: session.name,
                email: session.email,
            },
            counts: {
                teachers: teachers.length,
                classes: classes.length,
                students: students.length,
                attendance: attendance.length,
            },
            teachers,
            classes,
            students,
            attendance,
        };

        await writeAuditLog({
            actor: session,
            action: 'backup.export',
            entity_type: 'system',
            details: {
                teachers: teachers.length,
                classes: classes.length,
                students: students.length,
                attendance: attendance.length,
            },
        });

        return new NextResponse(JSON.stringify(payload, null, 2), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename=\"absensi_backup_${new Date().toISOString().split('T')[0]}.json\"`,
            },
        });
    } catch (error) {
        console.error('Backup export error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
