import { NextResponse } from 'next/server';
import { deleteSession } from '@/features/auth/session';
import { ApiResponse } from '@/types';

export async function POST() {
    try {
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
