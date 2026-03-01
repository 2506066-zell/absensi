import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/features/auth/session';
import { validateEmail, validateName, sanitizeString } from '@/lib/validation';
import { Teacher, ApiResponse } from '@/types';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email } = body;

        if (!name || !email) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Name and email are required' },
                { status: 400 }
            );
        }

        const cleanName = sanitizeString(name);
        const cleanEmail = sanitizeString(email).toLowerCase();

        if (!validateName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid name (2-100 characters)' },
                { status: 400 }
            );
        }

        if (!validateEmail(cleanEmail)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Look up or create teacher
        let teachers = await query<Teacher>(
            'SELECT * FROM teachers WHERE email = $1',
            [cleanEmail]
        );

        if (teachers.length === 0) {
            teachers = await query<Teacher>(
                'INSERT INTO teachers (name, email) VALUES ($1, $2) RETURNING *',
                [cleanName, cleanEmail]
            );
        }

        const teacher = teachers[0];

        // Create session
        await createSession({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
        });

        return NextResponse.json<ApiResponse<Teacher>>({
            success: true,
            data: teacher,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
