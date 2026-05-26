import { getDatabase } from './connection';
import { v4 as uuidv4 } from 'uuid';

export interface Event {
    id: string;
    title: string;
    description: string;
    category: 'Talk' | 'Workshop' | 'Club' | 'Exam' | 'Other';
    startDateTime: string;
    endDateTime?: string;
    locationName: string;
    locationAddress?: string;
    organizerName: string;
    capacity?: number;
    registeredCount: number;
    imageUrl?: string;
    tags?: string[];
    createdAt: string;
}

type EventRow = Omit<Event, 'tags'> & { tags: string | null };

function rowToEvent(row: EventRow): Event {
    return {
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
    };
}

export async function getEvents(filters?: {
    category?: string;
    period?: 'upcoming' | 'past';
    search?: string;
}): Promise<Event[]> {
    const db = await getDatabase();
    let query = 'SELECT * FROM events';
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.category && filters.category !== 'Tous') {
        conditions.push('category = ?');
        params.push(filters.category);
    }
    if (filters?.period === 'upcoming') {
        conditions.push("startDateTime >= datetime('now')");
    } else if (filters?.period === 'past') {
        conditions.push("startDateTime < datetime('now')");
    }
    if (filters?.search) {
        conditions.push('LOWER(title) LIKE ?');
        params.push(`%${filters.search.toLowerCase()}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY startDateTime ASC';

    const rows = await db.getAllAsync(query, params) as EventRow[];
    return rows.map(rowToEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync('SELECT * FROM events WHERE id = ?', [id]) as EventRow | null;
    return row ? rowToEvent(row) : null;
}

export async function createEvent(event: Omit<Event, 'id' | 'registeredCount' | 'createdAt'>): Promise<Event> {
    const db = await getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const tagsJson = event.tags ? JSON.stringify(event.tags) : null;

    await db.runAsync(
        `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [id, event.title, event.description, event.category, event.startDateTime,
            event.endDateTime ?? null, event.locationName, event.locationAddress ?? null,
            event.organizerName, event.capacity ?? null, event.imageUrl ?? null, tagsJson, createdAt]
    );
    const created = await getEventById(id);
    return created!;
}

export async function updateEvent(id: string, event: Partial<Omit<Event, 'id' | 'registeredCount' | 'createdAt'>>): Promise<void> {
    const db = await getDatabase();
    const tagsJson = event.tags !== undefined ? JSON.stringify(event.tags) : undefined;
    await db.runAsync(
        `UPDATE events SET title = COALESCE(?, title), description = COALESCE(?, description),
     category = COALESCE(?, category), startDateTime = COALESCE(?, startDateTime),
     endDateTime = ?, locationName = COALESCE(?, locationName),
     locationAddress = ?, organizerName = COALESCE(?, organizerName),
     capacity = ?, imageUrl = ?, tags = ?
     WHERE id = ?`,
        [event.title ?? null, event.description ?? null, event.category ?? null,
        event.startDateTime ?? null, event.endDateTime ?? null,
        event.locationName ?? null, event.locationAddress ?? null,
        event.organizerName ?? null, event.capacity ?? null,
        event.imageUrl ?? null, tagsJson ?? null, id]
    );
}

export async function deleteEvent(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
}
