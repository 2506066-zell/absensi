import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Class, ApiResponse } from '@/types';

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
