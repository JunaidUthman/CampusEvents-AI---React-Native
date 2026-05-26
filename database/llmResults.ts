import { getDatabase } from './connection';
import { v4 as uuidv4 } from 'uuid';

export interface LLMResult {
    id: string;
    eventId?: string;
    userId: string;
    type: 'search' | 'recommendation' | 'planning' | 'qa';
    inputText: string;
    outputText: string;
    createdAt: string;
}

type LLMResultRow = LLMResult & { eventId: string | null };

function rowToResult(row: LLMResultRow): LLMResult {
    return { ...row, eventId: row.eventId ?? undefined };
}

export async function saveLLMResult(result: Omit<LLMResult, 'id' | 'createdAt'>): Promise<void> {
    const db = await getDatabase();
    const id = uuidv4();
    await db.runAsync(
        'INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, result.eventId ?? null, result.userId, result.type, result.inputText, result.outputText, new Date().toISOString()]
    );
}

export async function getCachedResult(userId: string, type: string, inputText: string): Promise<LLMResult | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
        'SELECT * FROM llm_results WHERE userId = ? AND type = ? AND inputText = ? ORDER BY createdAt DESC LIMIT 1',
        [userId, type, inputText]
    ) as LLMResultRow | null;
    return row ? rowToResult(row) : null;
}
