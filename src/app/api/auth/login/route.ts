import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/features/auth/session';
import { validateEmail, validateName, sanitizeString } from '@/lib/validation';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME } from '@/config';
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

        const isDefaultAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL;

        // Look up or create teacher
        let teachers = await query<Teacher>(
            'SELECT * FROM teachers WHERE email = $1',
            [cleanEmail]
        );

        if (teachers.length === 0) {
            teachers = await query<Teacher>(
                'INSERT INTO teachers (name, email, role) VALUES ($1, $2, $3) RETURNING *',
                [isDefaultAdmin ? DEFAULT_ADMIN_NAME : cleanName, cleanEmail, isDefaultAdmin ? 'admin' : 'user']
            );
        }

        let teacher = teachers[0];

        // Keep only the default admin credentials as admin.
        if (isDefaultAdmin && (teacher.role !== 'admin' || teacher.name !== DEFAULT_ADMIN_NAME)) {
            const updated = await query<Teacher>(
                'UPDATE teachers SET name = $1, role = $2 WHERE id = $3 RETURNING *',
                [DEFAULT_ADMIN_NAME, 'admin', teacher.id]
            );
            teacher = updated[0];
        } else if (!isDefaultAdmin && teacher.role === 'admin') {
            const updated = await query<Teacher>(
                'UPDATE teachers SET role = $1 WHERE id = $2 RETURNING *',
                ['user', teacher.id]
            );
            teacher = updated[0];
        }

        // Create session
        await createSession({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            role: teacher.role,
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
