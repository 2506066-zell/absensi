import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/features/auth/session';
import { validateName, sanitizeString } from '@/lib/validation';
import { Class, ApiResponse, Teacher } from '@/types';

export async function GET() {
    try {
        const classes = await query<Class>(
            `SELECT c.id, c.name, c.teacher_id, t.name as teacher_name
       FROM classes c
       JOIN teachers t ON c.teacher_id = t.id
       ORDER BY c.name`
        );

        return NextResponse.json<ApiResponse<Class[]>>({
            success: true,
            data: classes,
        });
    } catch (error) {
        console.error('Classes fetch error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
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

        const body = await request.json();
        const { name } = body as { name?: string };

        if (!name) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class name is required' },
                { status: 400 }
            );
        }

        const cleanName = sanitizeString(name);
        if (!validateName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class name (2-100 characters)' },
                { status: 400 }
            );
        }

        const existing = await query<Class>(
            'SELECT id, name, teacher_id FROM classes WHERE teacher_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1',
            [session.id, cleanName]
        );
        if (existing.length > 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class already exists' },
                { status: 409 }
            );
        }

        const teacher = await query<Teacher>(
            'SELECT id, name, email, role, created_at FROM teachers WHERE id = $1 LIMIT 1',
            [session.id]
        );
        if (teacher.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Teacher account not found' },
                { status: 404 }
            );
        }

        const created = await query<Class>(
            `INSERT INTO classes (name, teacher_id)
       VALUES ($1, $2)
       RETURNING id, name, teacher_id`,
            [cleanName, session.id]
        );

        return NextResponse.json<ApiResponse<Class>>({
            success: true,
            data: created[0],
        });
    } catch (error) {
        console.error('Class create error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
