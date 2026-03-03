import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/session';
import { query } from '@/lib/db';
import { writeAuditLog } from '@/lib/audit';
import { sanitizeString, validateName } from '@/lib/validation';
import { ApiResponse, Class, SessionPayload } from '@/types';

async function requireAdmin(): Promise<SessionPayload | NextResponse<ApiResponse>> {
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
    return session;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAdmin();
        if (auth instanceof NextResponse) return auth;
        const session = auth;

        const { id } = await params;
        const classId = parseInt(id, 10);
        if (isNaN(classId) || classId <= 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class ID' },
                { status: 400 }
            );
        }

        const body = (await request.json()) as { name?: string };
        const cleanName = sanitizeString(body.name || '');
        if (!validateName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class name (2-100 characters)' },
                { status: 400 }
            );
        }

        const exists = await query<Class>(
            'SELECT id, name, teacher_id FROM classes WHERE id = $1 LIMIT 1',
            [classId]
        );
        if (exists.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class not found' },
                { status: 404 }
            );
        }

        const duplicate = await query<Class>(
            'SELECT id, name, teacher_id FROM classes WHERE id <> $1 AND LOWER(name) = LOWER($2) LIMIT 1',
            [classId, cleanName]
        );
        if (duplicate.length > 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class name already exists' },
                { status: 409 }
            );
        }

        const updated = await query<Class>(
            'UPDATE classes SET name = $1 WHERE id = $2 RETURNING id, name, teacher_id',
            [cleanName, classId]
        );

        await writeAuditLog({
            actor: session,
            action: 'class.update',
            entity_type: 'class',
            entity_id: classId,
            details: {
                old_name: exists[0].name,
                new_name: updated[0].name,
            },
        });

        return NextResponse.json<ApiResponse<Class>>({
            success: true,
            data: updated[0],
        });
    } catch (error) {
        console.error('Class update error:', error);
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
        const auth = await requireAdmin();
        if (auth instanceof NextResponse) return auth;
        const session = auth;

        const { id } = await params;
        const classId = parseInt(id, 10);
        if (isNaN(classId) || classId <= 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class ID' },
                { status: 400 }
            );
        }

        const deleted = await query<Class>(
            'DELETE FROM classes WHERE id = $1 RETURNING id, name, teacher_id',
            [classId]
        );
        if (deleted.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class not found' },
                { status: 404 }
            );
        }

        await writeAuditLog({
            actor: session,
            action: 'class.delete',
            entity_type: 'class',
            entity_id: classId,
            details: {
                class_name: deleted[0].name,
            },
        });

        return NextResponse.json<ApiResponse<Class>>({
            success: true,
            data: deleted[0],
        });
    } catch (error) {
        console.error('Class delete error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
