import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/features/auth/session';
import { validateEmail, validateFullName, validateName, sanitizeString } from '@/lib/validation';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_USER_EMAIL } from '@/config';
import { Teacher, ApiResponse } from '@/types';

interface LoginBody {
    name?: string;
    email?: string;
    mode?: 'admin' | 'user';
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as LoginBody;
        const cleanName = sanitizeString(body.name || '');
        const cleanEmail = sanitizeString(body.email || '').toLowerCase();
        const mode: 'admin' | 'user' = body.mode === 'admin' ? 'admin' : 'user';

        if (!cleanName) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Nama panjang wajib diisi' },
                { status: 400 }
            );
        }

        if (mode === 'user' && !validateFullName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Nama panjang harus minimal 2 kata' },
                { status: 400 }
            );
        }
        if (mode === 'admin' && !validateName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Nama admin tidak valid' },
                { status: 400 }
            );
        }

        let teacher: Teacher;

        if (mode === 'admin') {
            if (!validateEmail(cleanEmail)) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Email admin tidak valid' },
                    { status: 400 }
                );
            }

            if (cleanEmail !== DEFAULT_ADMIN_EMAIL || cleanName !== DEFAULT_ADMIN_NAME) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Kredensial admin tidak valid' },
                    { status: 401 }
                );
            }

            const existingAdmin = await query<Teacher>(
                'SELECT * FROM teachers WHERE email = $1 LIMIT 1',
                [DEFAULT_ADMIN_EMAIL]
            );

            if (existingAdmin.length === 0) {
                const created = await query<Teacher>(
                    'INSERT INTO teachers (name, email, role) VALUES ($1, $2, $3) RETURNING *',
                    [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, 'admin']
                );
                teacher = created[0];
            } else {
                teacher = existingAdmin[0];
                if (teacher.role !== 'admin' || teacher.name !== DEFAULT_ADMIN_NAME) {
                    const updated = await query<Teacher>(
                        'UPDATE teachers SET name = $1, role = $2 WHERE id = $3 RETURNING *',
                        [DEFAULT_ADMIN_NAME, 'admin', teacher.id]
                    );
                    teacher = updated[0];
                }
            }

            // Enforce single admin email.
            await query(
                'UPDATE teachers SET role = $1 WHERE email <> $2 AND role = $3',
                ['user', DEFAULT_ADMIN_EMAIL, 'admin']
            );
        } else {
            const existingUser = await query<Teacher>(
                'SELECT * FROM teachers WHERE email = $1 LIMIT 1',
                [DEFAULT_USER_EMAIL]
            );

            if (existingUser.length === 0) {
                const created = await query<Teacher>(
                    'INSERT INTO teachers (name, email, role) VALUES ($1, $2, $3) RETURNING *',
                    [cleanName, DEFAULT_USER_EMAIL, 'user']
                );
                teacher = created[0];
            } else {
                teacher = existingUser[0];
                if (teacher.role !== 'user' || teacher.name !== cleanName) {
                    const updated = await query<Teacher>(
                        'UPDATE teachers SET name = $1, role = $2 WHERE id = $3 RETURNING *',
                        [cleanName, 'user', teacher.id]
                    );
                    teacher = updated[0];
                }
            }
        }

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
