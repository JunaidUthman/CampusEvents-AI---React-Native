import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!dbPromise) {
        dbPromise = SQLite.openDatabaseAsync('campusevents.db').then(async db => {
            // Fixes "cannot create file" OPFS issues by avoiding journal files
            await db.execAsync('PRAGMA journal_mode = MEMORY;');
            return db;
        });
    }
    return dbPromise;
}
