import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/session';
import { query } from '@/lib/db';
import { ApiResponse, AuditLog } from '@/types';

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const rawLimit = parseInt(searchParams.get('limit') || '100', 10);
        const limit = Number.isNaN(rawLimit) ? 100 : Math.min(500, Math.max(1, rawLimit));

        const logs = await query<AuditLog>(
            `SELECT 
        id,
        actor_id,
        actor_name,
        actor_email,
        action,
        entity_type,
        entity_id,
        details,
        created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1`,
            [limit]
        );

        return NextResponse.json<ApiResponse<AuditLog[]>>({
            success: true,
            data: logs,
        });
    } catch (error) {
        console.error('Audit logs fetch error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
