import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/features/auth/session';
import { validateAttendancePayload } from '@/lib/validation';
import { AttendanceRecord, AttendancePayload, ApiResponse } from '@/types';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { records } = body as { records: AttendancePayload[] };

        if (!records || !validateAttendancePayload(records)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid attendance data' },
                { status: 400 }
            );
        }

        // Enforce full-class attendance submission for one class and one date.
        const first = records[0];
        const mixedClass = records.some((r) => r.class_id !== first.class_id);
        const mixedDate = records.some((r) => r.date !== first.date);
        if (mixedClass || mixedDate) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Attendance must be submitted for one class and one date only' },
                { status: 400 }
            );
        }

        const uniqueStudentIds = new Set(records.map((r) => r.student_id));
        if (uniqueStudentIds.size !== records.length) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Duplicate student entries found' },
                { status: 400 }
            );
        }

        const studentsInClass = await query<{ id: number }>(
            'SELECT id FROM students WHERE class_id = $1 ORDER BY id',
            [first.class_id]
        );
        if (studentsInClass.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class has no students' },
                { status: 400 }
            );
        }

        const expectedIds = new Set(studentsInClass.map((s) => s.id));
        const hasUnknownStudent = records.some((r) => !expectedIds.has(r.student_id));
        if (hasUnknownStudent) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Some students do not belong to this class' },
                { status: 400 }
            );
        }

        if (expectedIds.size !== uniqueStudentIds.size) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Attendance belum lengkap, isi semua siswa terlebih dahulu' },
                { status: 400 }
            );
        }

        // Bulk upsert attendance records
        const results: AttendanceRecord[] = [];
        for (const record of records) {
            const upserted = await query<AttendanceRecord>(
                `INSERT INTO attendance (student_id, class_id, teacher_id, date, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, date) 
         DO UPDATE SET status = $5, teacher_id = $3, updated_at = NOW()
         RETURNING *`,
                [record.student_id, record.class_id, session.id, record.date, record.status]
            );
            results.push(upserted[0]);
        }

        return NextResponse.json<ApiResponse<AttendanceRecord[]>>({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error('Attendance save error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const classId = searchParams.get('class_id');
        const studentId = searchParams.get('student_id');

        let queryText = `
      SELECT a.*, s.name as student_name, c.name as class_name, t.name as teacher_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      JOIN teachers t ON a.teacher_id = t.id
      WHERE 1=1
    `;
        const queryParams: unknown[] = [];
        let paramIdx = 1;

        if (date) {
            queryText += ` AND a.date = $${paramIdx++}`;
            queryParams.push(date);
        }

        if (classId) {
            queryText += ` AND a.class_id = $${paramIdx++}`;
            queryParams.push(parseInt(classId, 10));
        }

        if (studentId) {
            queryText += ` AND a.student_id = $${paramIdx++}`;
            queryParams.push(parseInt(studentId, 10));
        }

        queryText += ' ORDER BY a.date DESC, c.name, s.name';

        const records = await query<AttendanceRecord & { student_name: string; class_name: string; teacher_name: string }>(
            queryText,
            queryParams
        );

        return NextResponse.json<ApiResponse>({
            success: true,
            data: records,
        });
    } catch (error) {
        console.error('Attendance fetch error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
