import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/session';
import { ApiResponse, SessionPayload } from '@/types';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }
        return NextResponse.json<ApiResponse<SessionPayload>>({
            success: true,
            data: session,
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
