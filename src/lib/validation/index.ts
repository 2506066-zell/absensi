import { AttendanceStatus, AttendancePayload } from '@/types';

const VALID_STATUSES: AttendanceStatus[] = ['hadir', 'izin', 'sakit', 'alpha'];

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validateName(name: string): boolean {
    return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

export function validateStatus(status: string): status is AttendanceStatus {
    return VALID_STATUSES.includes(status as AttendanceStatus);
}

export function validateDate(dateStr: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

export function validateId(id: unknown): id is number {
    return typeof id === 'number' && Number.isInteger(id) && id > 0;
}

export function validateAttendancePayload(
    payload: unknown
): payload is AttendancePayload[] {
    if (!Array.isArray(payload)) return false;
    return payload.every(
        (item) =>
            validateId(item.student_id) &&
            validateId(item.class_id) &&
            validateStatus(item.status) &&
            validateDate(item.date)
    );
}

export function sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
}
