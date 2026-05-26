import { getDatabase } from './connection';
import { getEventById, Event } from './events';

export interface Favorite {
    eventId: string;
    userId: string;
    createdAt: string;
}

export async function getFavoritesByUser(userId: string): Promise<(Favorite & { event: Event })[]> {
    const db = await getDatabase();
    const favs = await db.getAllAsync(
        'SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
    ) as Favorite[];

    const withEvents = await Promise.all(
        favs.map(async f => ({ ...f, event: await getEventById(f.eventId) }))
    );
    return withEvents.filter(f => f.event !== null) as (Favorite & { event: Event })[];
}

export async function isFavorite(eventId: string, userId: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
        'SELECT 1 FROM favorites WHERE eventId = ? AND userId = ?',
        [eventId, userId]
    );
    return !!row;
}

export async function addFavorite(eventId: string, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
        'INSERT OR IGNORE INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)',
        [eventId, userId, new Date().toISOString()]
    );
}

export async function removeFavorite(eventId: string, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM favorites WHERE eventId = ? AND userId = ?', [eventId, userId]);
}
