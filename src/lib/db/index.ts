import { neon } from '@neondatabase/serverless';

function getDb() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        // Return a mock or handle missing URL gracefully during build
        return null;
    }
    return neon(databaseUrl);
}

export async function query<T>(
    queryText: string,
    params: unknown[] = []
): Promise<T[]> {
    const db = getDb();
    if (!db) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    const result = await (db as any).query(queryText, params);
    return result as T[];
}
