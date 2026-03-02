import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/session';
import { query } from '@/lib/db';
import { sanitizeString, validateName } from '@/lib/validation';
import { ApiResponse, Student } from '@/types';

async function requireAdmin() {
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
    return null;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const denied = await requireAdmin();
        if (denied) return denied;

        const { id } = await params;
        const studentId = parseInt(id, 10);
        if (isNaN(studentId) || studentId <= 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid student ID' },
                { status: 400 }
            );
        }

        const body = (await request.json()) as { name?: string };
        const cleanName = sanitizeString(body.name || '');
        if (!validateName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid student name (2-100 characters)' },
                { status: 400 }
            );
        }

        const existing = await query<Student>(
            'SELECT id, name, class_id FROM students WHERE id = $1 LIMIT 1',
            [studentId]
        );
        if (existing.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Student not found' },
                { status: 404 }
            );
        }

        const duplicate = await query<Student>(
            'SELECT id, name, class_id FROM students WHERE id <> $1 AND class_id = $2 AND LOWER(name) = LOWER($3) LIMIT 1',
            [studentId, existing[0].class_id, cleanName]
        );
        if (duplicate.length > 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Student name already exists in this class' },
                { status: 409 }
            );
        }

        const updated = await query<Student>(
            'UPDATE students SET name = $1 WHERE id = $2 RETURNING id, name, class_id',
            [cleanName, studentId]
        );

        return NextResponse.json<ApiResponse<Student>>({
            success: true,
            data: updated[0],
        });
    } catch (error) {
        console.error('Student update error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const denied = await requireAdmin();
        if (denied) return denied;

        const { id } = await params;
        const studentId = parseInt(id, 10);
        if (isNaN(studentId) || studentId <= 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid student ID' },
                { status: 400 }
            );
        }

        const deleted = await query<Student>(
            'DELETE FROM students WHERE id = $1 RETURNING id, name, class_id',
            [studentId]
        );
        if (deleted.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<Student>>({
            success: true,
            data: deleted[0],
        });
    } catch (error) {
        console.error('Student delete error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
