import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/session';
import { query } from '@/lib/db';
import { sanitizeString, validateName } from '@/lib/validation';
import { ApiResponse, Class, Student } from '@/types';
import * as XLSX from 'xlsx';

interface ImportResult {
    inserted: number;
    skipped: number;
    invalid_rows: number;
    total_rows: number;
}

async function requireAdmin() {
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
    return null;
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const denied = await requireAdmin();
        if (denied) return denied;

        const { id } = await params;
        const classId = parseInt(id, 10);
        if (isNaN(classId) || classId <= 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class ID' },
                { status: 400 }
            );
        }

        const cls = await query<Class>(
            'SELECT id, name, teacher_id FROM classes WHERE id = $1 LIMIT 1',
            [classId]
        );
        if (cls.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Class not found' },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        if (!(file instanceof File)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'File is required' },
                { status: 400 }
            );
        }

        const fileName = file.name.toLowerCase();
        const supported =
            fileName.endsWith('.csv') ||
            fileName.endsWith('.xlsx') ||
            fileName.endsWith('.xls');
        if (!supported) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Only CSV or Excel files are supported' },
                { status: 400 }
            );
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'File too large (max 5MB)' },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'File has no sheet' },
                { status: 400 }
            );
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
            header: 1,
            defval: '',
            raw: false,
        });

        const names: string[] = [];
        let invalidRows = 0;

        rows.forEach((row, index) => {
            const firstCell = sanitizeString(String(row?.[0] ?? ''));
            if (!firstCell) return;

            if (index === 0 && firstCell.toLowerCase() === 'name') {
                return;
            }

            if (!validateName(firstCell)) {
                invalidRows++;
                return;
            }
            names.push(firstCell);
        });

        const uniqueNames = Array.from(
            new Map(names.map((n) => [n.toLowerCase(), n])).values()
        );

        if (uniqueNames.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'No valid student names found' },
                { status: 400 }
            );
        }

        let inserted = 0;
        for (const name of uniqueNames) {
            const created = await query<Student>(
                `INSERT INTO students (name, class_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING id, name, class_id`,
                [name, classId]
            );
            if (created.length > 0) inserted++;
        }

        const result: ImportResult = {
            inserted,
            skipped: uniqueNames.length - inserted,
            invalid_rows: invalidRows,
            total_rows: rows.length,
        };

        return NextResponse.json<ApiResponse<ImportResult>>({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Student import error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
