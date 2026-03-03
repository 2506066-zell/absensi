import { query } from '@/lib/db';

interface AuditActor {
    id: number;
    name: string;
    email: string;
}

interface AuditLogInput {
    actor: AuditActor | null;
    action: string;
    entity_type: string;
    entity_id?: number | null;
    details?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
    try {
        const payload = input.details ?? {};
        await query(
            `INSERT INTO audit_logs (actor_id, actor_name, actor_email, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
            [
                input.actor?.id ?? null,
                input.actor?.name ?? null,
                input.actor?.email ?? null,
                input.action,
                input.entity_type,
                input.entity_id ?? null,
                JSON.stringify(payload),
            ]
        );
    } catch (error) {
        console.error('Audit log write error:', error);
    }
}
