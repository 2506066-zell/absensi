import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { StudentWithAttendance, ApiResponse } from '@/types';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const classId = parseInt(id, 10);

        if (isNaN(classId) || classId <= 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class ID' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const students = await query<StudentWithAttendance>(
            `SELECT s.id, s.name, s.class_id, a.status, a.id as attendance_id
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $2
       WHERE s.class_id = $1
       ORDER BY s.name`,
            [classId, date]
        );

        return NextResponse.json<ApiResponse<StudentWithAttendance[]>>({
            success: true,
            data: students,
        });
    } catch (error) {
        console.error('Students fetch error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
