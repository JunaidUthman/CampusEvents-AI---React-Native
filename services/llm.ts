import { Event } from '../database/events';
import { Registration } from '../database/registrations';
import { saveLLMResult, getCachedResult } from '../database/llmResults';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';
const MAX_CONTEXT_CHARS = 6000;

function getApiKey(): string {
    const key = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ?? '';
    return key;
}

function truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...[tronqué]';
}

async function callDeepSeek(systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
        throw new Error('Clé API DeepSeek non configurée. Veuillez renseigner EXPO_PUBLIC_DEEPSEEK_API_KEY dans votre fichier .env');
    }

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            max_tokens: 1024,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = (err as any)?.error?.message ?? `Erreur HTTP ${response.status}`;
        throw new Error(msg);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
}

// ─────────────────────────────────────────────────────────────────────
// PROMPT 1 — Recherche en langage naturel
// Rôle : identifier parmi le catalogue les événements correspondant
//        sémantiquement à la requête, même sans correspondance de mot-clé.
// Sortie : JSON array [{eventId, title, relevance, justification}]
// ─────────────────────────────────────────────────────────────────────
export async function naturalLanguageSearch(
    query: string,
    events: Event[],
    userId: string
): Promise<Array<{ eventId: string; title: string; relevance: 'Très pertinent' | 'Pertinent'; justification: string }>> {
    const cacheKey = `search:${query}`;
    const cached = await getCachedResult(userId, 'search', cacheKey);
    if (cached) return JSON.parse(cached.outputText);

    const catalogue = truncate(
        JSON.stringify(events.map(e => ({
            id: e.id, title: e.title, description: e.description,
            category: e.category, startDateTime: e.startDateTime,
            locationName: e.locationName, tags: e.tags,
        }))),
        MAX_CONTEXT_CHARS
    );

    const systemPrompt = `Tu es un assistant de recherche pour une application universitaire d'événements du campus.
Ta mission : analyser une requête étudiant en langage naturel et identifier les événements du catalogue qui correspondent sémantiquement, même si les mots-clés exacts ne correspondent pas.
Réponds UNIQUEMENT avec un JSON valide, sans aucun texte autour. Format attendu :
[{"eventId":"...","title":"...","relevance":"Très pertinent"|"Pertinent","justification":"1 courte phrase"}]
Si aucun événement ne correspond, retourne un tableau vide [].
Limite : 5 résultats maximum.`;

    const userMessage = `Requête étudiant : "${query}"\n\nCatalogue JSON :\n${catalogue}`;

    const output = await callDeepSeek(systemPrompt, userMessage);
    const jsonStr = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    await saveLLMResult({ userId, type: 'search', inputText: cacheKey, outputText: JSON.stringify(result) });
    return result;
}

// ─────────────────────────────────────────────────────────────────────
// PROMPT 2 — Recommandation personnalisée
// Rôle : analyser l'historique (favoris + inscriptions) de l'étudiant
//        et suggérer 3 événements à venir cohérents avec son profil.
// Sortie : JSON array [{eventId, title, category, startDateTime, justification}]
// ─────────────────────────────────────────────────────────────────────
export async function personalizedRecommendation(
    userId: string,
    history: { favorites: Array<{ title: string; category: string; tags?: string[] }>; registrations: Array<{ title: string; category: string }> },
    upcomingEvents: Event[]
): Promise<Array<{ eventId: string; title: string; category: string; startDateTime: string; justification: string }>> {
    const cacheKey = `rec:${JSON.stringify(history).substring(0, 200)}`;
    const cached = await getCachedResult(userId, 'recommendation', cacheKey);
    if (cached) return JSON.parse(cached.outputText);

    const historyStr = truncate(JSON.stringify(history), 2000);
    const upcoming = truncate(
        JSON.stringify(upcomingEvents.map(e => ({
            id: e.id, title: e.title, category: e.category,
            startDateTime: e.startDateTime, tags: e.tags, description: e.description.substring(0, 100),
        }))),
        MAX_CONTEXT_CHARS - 2000
    );

    const systemPrompt = `Tu es un moteur de recommandation pour une application universitaire d'événements.
Analyse l'historique (favoris et inscriptions passées) d'un étudiant et recommande 3 événements à venir qui correspondent à son profil.
Réponds UNIQUEMENT avec un JSON valide, sans aucun texte autour. Format attendu :
[{"eventId":"...","title":"...","category":"...","startDateTime":"...","justification":"1 courte phrase expliquant pourquoi cet événement correspond au profil"}]
Ne recommande que des événements présents dans le catalogue fourni.`;

    const userMessage = `Historique de l'étudiant :\n${historyStr}\n\nÉvénements à venir :\n${upcoming}`;

    const output = await callDeepSeek(systemPrompt, userMessage);
    const jsonStr = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    await saveLLMResult({ userId, type: 'recommendation', inputText: cacheKey, outputText: JSON.stringify(result) });
    return result;
}

// ─────────────────────────────────────────────────────────────────────
// PROMPT 3 — Assistant de planification
// Rôle : générer un planning de participation pour la semaine
//        en tenant compte des contraintes saisies par l'étudiant.
// Sortie : JSON {suggestions:[{eventId,title,date,time,note}], conflicts:[{eventId,title,reason}]}
// ─────────────────────────────────────────────────────────────────────
export async function weekPlanning(
    userId: string,
    constraints: string,
    weekEvents: Event[]
): Promise<{ suggestions: Array<{ eventId: string; title: string; date: string; time: string; note: string }>; conflicts: Array<{ eventId: string; title: string; reason: string }> }> {
    const cacheKey = `plan:${constraints}`;
    const cached = await getCachedResult(userId, 'planning', cacheKey);
    if (cached) return JSON.parse(cached.outputText);

    const eventsStr = truncate(
        JSON.stringify(weekEvents.map(e => ({
            id: e.id, title: e.title, startDateTime: e.startDateTime,
            endDateTime: e.endDateTime, locationName: e.locationName, category: e.category,
        }))),
        MAX_CONTEXT_CHARS
    );

    const systemPrompt = `Tu es un assistant de planification universitaire.
L'étudiant te décrit ses contraintes horaires. Tu dois produire un planning de participation aux événements de la semaine, sans conflits avec ses contraintes.
Réponds UNIQUEMENT avec un JSON valide, sans texte autour. Format attendu :
{"suggestions":[{"eventId":"...","title":"...","date":"Lun 12 avr","time":"14h00","note":"courte note"}],"conflicts":[{"eventId":"...","title":"...","reason":"raison du conflit"}]}
Dates en format français (ex: "Lun 14 avr · 14h00"). Notes concises (max 8 mots).`;

    const userMessage = `Contraintes de l'étudiant : "${constraints}"\n\nÉvénements de la semaine :\n${eventsStr}`;

    const output = await callDeepSeek(systemPrompt, userMessage);
    const jsonStr = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    await saveLLMResult({ userId, type: 'planning', inputText: cacheKey, outputText: JSON.stringify(result) });
    return result;
}

// ─────────────────────────────────────────────────────────────────────
// PROMPT 4 — Questions sur le catalogue global (Q&A)
// Rôle : répondre à des questions ouvertes sur l'ensemble du catalogue.
// Sortie : JSON {answer: string, relevantEvents: [{id, title}]}
// ─────────────────────────────────────────────────────────────────────
export async function catalogueQA(
    question: string,
    events: Event[],
    userId: string
): Promise<{ answer: string; relevantEvents: Array<{ id: string; title: string }> }> {
    const cacheKey = `qa:${question}`;
    const cached = await getCachedResult(userId, 'qa', cacheKey);
    if (cached) return JSON.parse(cached.outputText);

    const catalogue = truncate(
        JSON.stringify(events.map(e => ({
            id: e.id, title: e.title, category: e.category,
            startDateTime: e.startDateTime, organizerName: e.organizerName,
            capacity: e.capacity, registeredCount: e.registeredCount,
            tags: e.tags, description: e.description.substring(0, 80),
        }))),
        MAX_CONTEXT_CHARS
    );

    const systemPrompt = `Tu es un assistant intelligent pour une application universitaire d'événements du campus.
Tu réponds aux questions des étudiants sur l'ensemble du catalogue d'événements.
Réponds en français. Réponds UNIQUEMENT avec un JSON valide. Format attendu :
{"answer":"Réponse claire et utile en 2–4 phrases","relevantEvents":[{"id":"...","title":"..."}]}
relevantEvents = liste des événements mentionnés dans ta réponse (peut être vide []).
Sois précis, utile, et appuie-toi uniquement sur les données fournies.`;

    const userMessage = `Question : "${question}"\n\nCatalogue JSON :\n${catalogue}`;

    const output = await callDeepSeek(systemPrompt, userMessage);
    const jsonStr = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    await saveLLMResult({ userId, type: 'qa', inputText: cacheKey, outputText: JSON.stringify(result) });
    return result;
}
