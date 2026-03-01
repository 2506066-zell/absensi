const DB_NAME = 'absensi_offline';
const STORE_NAME = 'pending_attendance';
const DB_VERSION = 1;

interface PendingRecord {
    id?: number;
    records: {
        student_id: number;
        class_id: number;
        status: string;
        date: string;
    }[];
    timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function savePendingAttendance(
    records: PendingRecord['records']
): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.add({ records, timestamp: Date.now() });

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getPendingAttendance(): Promise<PendingRecord[]> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function removePendingAttendance(id: number): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function syncPendingAttendance(): Promise<number> {
    const pending = await getPendingAttendance();
    let synced = 0;

    for (const record of pending) {
        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: record.records }),
            });

            if (response.ok) {
                await removePendingAttendance(record.id!);
                synced++;
            }
        } catch {
            // Still offline, skip
            break;
        }
    }

    return synced;
}
