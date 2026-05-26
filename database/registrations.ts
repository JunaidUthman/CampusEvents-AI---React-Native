import { getDatabase } from './connection';
import { v4 as uuidv4 } from 'uuid';

export interface Registration {
    id: string;
    eventId: string;
    userId: string;
    createdAt: string;
    status: 'confirmed' | 'cancelled';
}

export async function getRegistrationsByUser(userId: string): Promise<Registration[]> {
    const db = await getDatabase();
    return await db.getAllAsync(
        'SELECT * FROM registrations WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
    ) as Registration[];
}

export async function isRegistered(eventId: string, userId: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
        "SELECT id FROM registrations WHERE eventId = ? AND userId = ? AND status = 'confirmed'",
        [eventId, userId]
    );
    return !!row;
}

export async function registerForEvent(eventId: string, userId: string): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync(
        'SELECT id, status FROM registrations WHERE eventId = ? AND userId = ?',
        [eventId, userId]
    ) as { id: string; status: string } | null;

    if (existing) {
        if (existing.status === 'cancelled') {
            await db.runAsync(
                'UPDATE registrations SET status = ?, createdAt = ? WHERE id = ?',
                ['confirmed', new Date().toISOString(), existing.id]
            );
            await db.runAsync('UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?', [eventId]);
        }
        return;
    }

    const id = uuidv4();
    await db.runAsync(
        'INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)',
        [id, eventId, userId, new Date().toISOString(), 'confirmed']
    );
    await db.runAsync('UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?', [eventId]);
}

export async function cancelRegistration(eventId: string, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
        "UPDATE registrations SET status = 'cancelled' WHERE eventId = ? AND userId = ?",
        [eventId, userId]
    );
    await db.runAsync(
        'UPDATE events SET registeredCount = MAX(0, registeredCount - 1) WHERE id = ?',
        [eventId]
    );
}
