import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/features/auth/session';
import { ApiResponse, StudentAttendanceSummary } from '@/types';

type Period = 'weekly' | 'monthly';

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getRange(baseDateString: string, period: Period): { start: string; end: string } {
    const base = new Date(`${baseDateString}T00:00:00Z`);
    if (Number.isNaN(base.getTime())) {
        const today = new Date();
        const fallback = today.toISOString().split('T')[0];
        return getRange(fallback, period);
    }

    if (period === 'monthly') {
        const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
        const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0));
        return { start: formatDate(start), end: formatDate(end) };
    }

    const dayIndex = (base.getUTCDay() + 6) % 7; // Monday = 0
    const start = new Date(base);
    start.setUTCDate(base.getUTCDate() - dayIndex);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return { start: formatDate(start), end: formatDate(end) };
}

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const period = (searchParams.get('period') as Period) || 'weekly';
        const classIdRaw = searchParams.get('class_id');
        const classId = classIdRaw ? parseInt(classIdRaw, 10) : null;

        if (period !== 'weekly' && period !== 'monthly') {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid period (use weekly or monthly)' },
                { status: 400 }
            );
        }
        if (classIdRaw && (classId === null || Number.isNaN(classId) || classId <= 0)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid class ID' },
                { status: 400 }
            );
        }

        const { start, end } = getRange(date, period);

        let sql = `
      SELECT 
        s.id AS student_id,
        s.name AS student_name,
        c.id AS class_id,
        c.name AS class_name,
        COALESCE(SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END), 0)::int AS hadir,
        COALESCE(SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END), 0)::int AS izin,
        COALESCE(SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END), 0)::int AS sakit,
        COALESCE(SUM(CASE WHEN a.status = 'alpha' THEN 1 ELSE 0 END), 0)::int AS alpha,
        COALESCE(COUNT(a.id), 0)::int AS total_recorded
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date BETWEEN $1 AND $2
      WHERE 1=1
    `;
        const params: unknown[] = [start, end];

        if (classId) {
            sql += ' AND c.id = $3';
            params.push(classId);
        }

        sql += `
      GROUP BY s.id, s.name, c.id, c.name
      ORDER BY c.name, s.name
    `;

        const summary = await query<StudentAttendanceSummary>(sql, params);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                period,
                period_start: start,
                period_end: end,
                rows: summary,
            },
        });
    } catch (error) {
        console.error('Student summary error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
