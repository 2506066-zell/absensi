import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AttendanceExportRow } from '@/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const classId = searchParams.get('class_id');

        let queryText = `
      SELECT a.date, c.name as class_name, s.name as student_name,
             a.status, t.name as teacher_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      JOIN teachers t ON a.teacher_id = t.id
      WHERE 1=1
    `;
        const queryParams: unknown[] = [];
        let paramIdx = 1;

        if (date) {
            queryText += ` AND a.date = $${paramIdx++}`;
            queryParams.push(date);
        }

        if (classId) {
            queryText += ` AND a.class_id = $${paramIdx++}`;
            queryParams.push(parseInt(classId, 10));
        }

        queryText += ' ORDER BY a.date DESC, c.name, s.name';

        const records = await query<AttendanceExportRow>(queryText, queryParams);

        // Build CSV
        const headers = ['Tanggal', 'Kelas', 'Nama Siswa', 'Status', 'Guru'];
        const csvRows = [
            headers.join(','),
            ...records.map((r) =>
                [
                    r.date,
                    `"${r.class_name}"`,
                    `"${r.student_name}"`,
                    r.status,
                    `"${r.teacher_name}"`,
                ].join(',')
            ),
        ];

        const csv = csvRows.join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="attendance_${date || 'all'}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
