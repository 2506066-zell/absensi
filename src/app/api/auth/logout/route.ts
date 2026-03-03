import { NextResponse } from 'next/server';
import { deleteSession, getSession } from '@/features/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { ApiResponse } from '@/types';

export async function POST() {
    try {
        const session = await getSession();
        if (session) {
            await writeAuditLog({
                actor: session,
                action: 'auth.logout',
                entity_type: 'teacher',
                entity_id: session.id,
            });
        }

        await deleteSession();
        return NextResponse.json<ApiResponse>({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
