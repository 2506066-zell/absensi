import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/features/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { validateEmail, validateFullName, sanitizeString } from '@/lib/validation';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_USER_EMAIL } from '@/config';
import { Teacher, ApiResponse } from '@/types';

interface LoginBody {
    name?: string;
    email?: string;
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as LoginBody;
        const cleanName = sanitizeString(body.name || '');
        const cleanEmail = sanitizeString(body.email || '').toLowerCase();

        if (!cleanName || !cleanEmail) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Nama panjang dan email wajib diisi' },
                { status: 400 }
            );
        }

        if (!validateEmail(cleanEmail)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Format email tidak valid' },
                { status: 400 }
            );
        }

        const isAdminLogin = cleanEmail === DEFAULT_ADMIN_EMAIL;

        if (!isAdminLogin && !validateFullName(cleanName)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Nama panjang harus minimal 2 kata' },
                { status: 400 }
            );
        }

        let teacher: Teacher;

        if (isAdminLogin) {
            if (cleanName !== DEFAULT_ADMIN_NAME) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Kredensial admin tidak valid' },
                    { status: 401 }
                );
            }

            const existingAdmin = await query<Teacher>(
                'SELECT * FROM teachers WHERE email = $1 LIMIT 1',
                [cleanEmail]
            );

            if (existingAdmin.length === 0) {
                const created = await query<Teacher>(
                    'INSERT INTO teachers (name, email, role) VALUES ($1, $2, $3) RETURNING *',
                    [DEFAULT_ADMIN_NAME, cleanEmail, 'admin']
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
                ['user', cleanEmail, 'admin']
            );
        } else {
            if (cleanEmail !== DEFAULT_USER_EMAIL) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: `Email user harus ${DEFAULT_USER_EMAIL}` },
                    { status: 401 }
                );
            }

            const existingUser = await query<Teacher>(
                'SELECT * FROM teachers WHERE email = $1 LIMIT 1',
                [cleanEmail]
            );

            if (existingUser.length === 0) {
                const created = await query<Teacher>(
                    'INSERT INTO teachers (name, email, role) VALUES ($1, $2, $3) RETURNING *',
                    [cleanName, cleanEmail, 'user']
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

        await writeAuditLog({
            actor: teacher,
            action: 'auth.login',
            entity_type: 'teacher',
            entity_id: teacher.id,
            details: {
                role: teacher.role,
            },
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
