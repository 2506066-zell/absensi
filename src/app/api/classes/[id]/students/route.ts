import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/features/auth/session';
import { validateName, sanitizeString } from '@/lib/validation';
import { Student, StudentWithAttendance, ApiResponse, Class } from '@/types';

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

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const classId = parseInt(id, 10);
        if (isNaN(classId) || classId <= 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name } = body as { name?: string };

        if (!name) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Student name is required' },
                { status: 400 }
            );
        }

        const cleanName = sanitizeString(name);
        if (!validateName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid student name (2-100 characters)' },
                { status: 400 }
            );
        }

        const classes = await query<Class>(
            'SELECT id, teacher_id, name FROM classes WHERE id = $1',
            [classId]
        );
        if (classes.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class not found' },
                { status: 404 }
            );
        }

        const existing = await query<Student>(
            'SELECT id, name, class_id FROM students WHERE class_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1',
            [classId, cleanName]
        );
        if (existing.length > 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Student already exists in this class' },
                { status: 409 }
            );
        }

        const created = await query<Student>(
            `INSERT INTO students (name, class_id)
       VALUES ($1, $2)
       RETURNING id, name, class_id`,
            [cleanName, classId]
        );

        return NextResponse.json<ApiResponse<Student>>({
            success: true,
            data: created[0],
        });
    } catch (error) {
        console.error('Student create error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
