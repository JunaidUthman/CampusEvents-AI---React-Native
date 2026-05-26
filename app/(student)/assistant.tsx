import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getEvents, Event } from '../../database/events';
import { getFavoritesByUser } from '../../database/favorites';
import { getRegistrationsByUser } from '../../database/registrations';
import { getEventById } from '../../database/events';
import {
    naturalLanguageSearch,
    personalizedRecommendation,
    weekPlanning,
    catalogueQA,
} from '../../services/llm';
import { Colors, Typography, Radius, Shadow } from '../../constants/theme';

// ─── types ────────────────────────────────────────────────────────────
type Section = 'search' | 'recommendation' | 'planning' | 'qa';

interface AIState<T> {
    loading: boolean;
    error: string | null;
    result: T | null;
}

function useAI<T>() {
    const [state, setState] = useState<AIState<T>>({ loading: false, error: null, result: null });

    async function run(fn: () => Promise<T>) {
        setState({ loading: true, error: null, result: null });
        try {
            const result = await fn();
            setState({ loading: false, error: null, result });
        } catch (e: any) {
            setState({ loading: false, error: e?.message ?? 'Erreur inconnue', result: null });
        }
    }

    return { ...state, run };
}

// ─── Shared UI atoms ──────────────────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon as any} size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function AILoadingState() {
    return (
        <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.stateText}>Analyse en cours…</Text>
        </View>
    );
}

function AIErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <View style={[styles.stateBox, styles.errorBox]}>
            <Ionicons name="cloud-offline-outline" size={24} color={Colors.danger} />
            <Text style={styles.errorText}>{message}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
        </View>
    );
}

function AIEmptyState({ message }: { message: string }) {
    return (
        <View style={styles.stateBox}>
            <Ionicons name="search-outline" size={24} color={Colors.textMuted} />
            <Text style={styles.stateText}>{message}</Text>
        </View>
    );
}

function formatEventDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' · ' +
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Main screen ──────────────────────────────────────────────────────
export default function AssistantScreen() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('search');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const search = useAI<Awaited<ReturnType<typeof naturalLanguageSearch>>>();

    // Recommendation
    const reco = useAI<Awaited<ReturnType<typeof personalizedRecommendation>>>();

    // Planning
    const [planConstraints, setPlanConstraints] = useState('');
    const plan = useAI<Awaited<ReturnType<typeof weekPlanning>>>();

    // Q&A
    const [qaQuestion, setQaQuestion] = useState('');
    const qa = useAI<Awaited<ReturnType<typeof catalogueQA>>>();

    const anyLoading = search.loading || reco.loading || plan.loading || qa.loading;

    // ── handlers ───────────────────────────────────────────────────────
    function handleSearch() {
        if (!searchQuery.trim() || !user) return;
        search.run(async () => {
            const events = await getEvents();
            return await naturalLanguageSearch(searchQuery.trim(), events, user.email);
        });
    }

    function handleReco() {
        if (!user) return;
        reco.run(async () => {
            const favsResult = await getFavoritesByUser(user.email);
            const favs = favsResult.map(f => ({
                title: f.event?.title ?? '',
                category: f.event?.category ?? 'Other',
                tags: f.event?.tags,
            }));
            const regsResult = await getRegistrationsByUser(user.email);
            const regs = await Promise.all(regsResult.map(async r => {
                const ev = await getEventById(r.eventId);
                return { title: ev?.title ?? '', category: ev?.category ?? 'Other' };
            }));
            const upcoming = await getEvents({ period: 'upcoming' });
            return await personalizedRecommendation(user.email, { favorites: favs, registrations: regs }, upcoming);
        });
    }

    function handlePlan() {
        if (!planConstraints.trim() || !user) return;
        plan.run(async () => {
            const now = new Date();
            const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
            const allUpcoming = await getEvents({ period: 'upcoming' });
            const weekEvents = allUpcoming.filter(e => new Date(e.startDateTime) <= weekEnd);
            return await weekPlanning(user.email, planConstraints.trim(), weekEvents);
        });
    }

    function handleQA() {
        if (!qaQuestion.trim() || !user) return;
        qa.run(async () => {
            const events = await getEvents();
            return await catalogueQA(qaQuestion.trim(), events, user.email);
        });
    }

    // ── sections ───────────────────────────────────────────────────────
    const SECTIONS = [
        { key: 'search' as Section, label: 'Recherche', icon: 'search-outline' },
        { key: 'recommendation' as Section, label: 'Recommandations', icon: 'star-outline' },
        { key: 'planning' as Section, label: 'Planning', icon: 'calendar-outline' },
        { key: 'qa' as Section, label: 'Q&A', icon: 'help-circle-outline' },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            {/* Warning banner */}
            <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                <Text style={styles.warningText}>Ne soumettez pas de données personnelles ou sensibles</Text>
            </View>

            {/* Section tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                {SECTIONS.map(s => (
                    <TouchableOpacity
                        key={s.key}
                        style={[styles.tab, activeSection === s.key && styles.tabActive]}
                        onPress={() => setActiveSection(s.key)}
                    >
                        <Ionicons name={s.icon as any} size={14} color={activeSection === s.key ? Colors.primary : Colors.textMuted} />
                        <Text numberOfLines={1} style={[styles.tabText, activeSection === s.key && styles.tabTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* ── 1. NL Search ─────────────────────────── */}
                {activeSection === 'search' && (
                    <View style={styles.section}>
                        <SectionHeader title="RECHERCHE EN LANGAGE NATUREL" icon="search-outline" />
                        <Text style={styles.sectionDesc}>Décrivez ce que vous cherchez sans vous soucier des mots-clés exacts.</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="ex: un atelier pratique, pas trop tôt le matin…"
                                placeholderTextColor={Colors.textMuted}
                                multiline
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.actionBtn, (anyLoading || !searchQuery.trim()) && styles.actionBtnDisabled]}
                            onPress={handleSearch}
                            disabled={anyLoading || !searchQuery.trim()}
                        >
                            {search.loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Rechercher</Text>}
                        </TouchableOpacity>

                        {search.loading && <AILoadingState />}
                        {search.error && <AIErrorState message={search.error} onRetry={handleSearch} />}
                        {search.result !== null && !search.loading && !search.error && (
                            search.result.length === 0
                                ? <AIEmptyState message="Aucun événement ne correspond à votre recherche." />
                                : search.result.map((r, i) => (
                                    <View key={i} style={styles.resultCard}>
                                        <View style={[styles.relevanceDot, r.relevance === 'Très pertinent' ? styles.dotHigh : styles.dotMed]} />
                                        <View style={styles.resultBody}>
                                            <Text style={[styles.relevanceLabel, r.relevance === 'Très pertinent' ? styles.labelHigh : styles.labelMed]}>
                                                {r.relevance}
                                            </Text>
                                            <Text style={styles.resultTitle}>{r.title}</Text>
                                            <Text style={styles.resultJustification}>{r.justification}</Text>
                                        </View>
                                    </View>
                                ))
                        )}
                    </View>
                )}

                {/* ── 2. Recommendation ────────────────────── */}
                {activeSection === 'recommendation' && (
                    <View style={styles.section}>
                        <SectionHeader title="POUR VOUS — BASÉ SUR VOTRE HISTORIQUE" icon="star-outline" />
                        <Text style={styles.sectionDesc}>L'IA analyse vos favoris et inscriptions pour vous suggérer 3 événements pertinents.</Text>
                        <TouchableOpacity
                            style={[styles.actionBtn, (anyLoading) && styles.actionBtnDisabled]}
                            onPress={handleReco}
                            disabled={anyLoading}
                        >
                            {reco.loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Générer mes recommandations</Text>}
                        </TouchableOpacity>

                        {reco.loading && <AILoadingState />}
                        {reco.error && <AIErrorState message={reco.error} onRetry={handleReco} />}
                        {reco.result !== null && !reco.loading && !reco.error && (
                            reco.result.length === 0
                                ? <AIEmptyState message="Pas assez d'historique pour générer des recommandations. Inscrivez-vous à des événements !" />
                                : reco.result.map((r, i) => (
                                    <View key={i} style={styles.recoCard}>
                                        <View style={styles.recoHeader}>
                                            <View style={styles.recoCategoryBadge}>
                                                <Text style={styles.recoCategoryText}>{r.category}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.recoTitle}>{r.title}</Text>
                                        <Text style={styles.recoDate}>{formatEventDate(r.startDateTime)}</Text>
                                        <Text style={styles.recoJustification}>{r.justification}</Text>
                                    </View>
                                ))
                        )}
                    </View>
                )}

                {/* ── 3. Planning ───────────────────────────── */}
                {activeSection === 'planning' && (
                    <View style={styles.section}>
                        <SectionHeader title="PLANIFIER MA SEMAINE" icon="calendar-outline" />
                        <Text style={styles.sectionDesc}>Décrivez vos contraintes horaires et l'IA génère un planning sans conflit.</Text>
                        <TextInput
                            style={[styles.input, styles.inputArea]}
                            value={planConstraints}
                            onChangeText={setPlanConstraints}
                            placeholder="ex: J'ai cours lundi et mercredi matin, exam jeudi…"
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={[styles.actionBtn, (anyLoading || !planConstraints.trim()) && styles.actionBtnDisabled]}
                            onPress={handlePlan}
                            disabled={anyLoading || !planConstraints.trim()}
                        >
                            {plan.loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Générer le planning</Text>}
                        </TouchableOpacity>

                        {plan.loading && <AILoadingState />}
                        {plan.error && <AIErrorState message={plan.error} onRetry={handlePlan} />}
                        {plan.result !== null && !plan.loading && !plan.error && (
                            <View style={styles.planBox}>
                                <Text style={styles.planBoxTitle}>Planning suggéré</Text>
                                {plan.result.suggestions.length === 0 && plan.result.conflicts.length === 0
                                    ? <AIEmptyState message="Aucun événement disponible cette semaine." />
                                    : <>
                                        {plan.result.suggestions.map((s, i) => (
                                            <View key={i} style={styles.planRow}>
                                                <View style={styles.planDot} />
                                                <View>
                                                    <Text style={styles.planDate}>{s.date} · {s.time}</Text>
                                                    <Text style={styles.planTitle}>{s.title}</Text>
                                                    <Text style={styles.planNote}>{s.note}</Text>
                                                </View>
                                            </View>
                                        ))}
                                        {plan.result.conflicts.map((c, i) => (
                                            <View key={i} style={styles.conflictRow}>
                                                <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                                                <Text style={styles.conflictText}>{c.title} — {c.reason}</Text>
                                            </View>
                                        ))}
                                    </>
                                }
                            </View>
                        )}
                    </View>
                )}

                {/* ── 4. Q&A ────────────────────────────────── */}
                {activeSection === 'qa' && (
                    <View style={styles.section}>
                        <SectionHeader title="QUESTIONS SUR LE CATALOGUE" icon="help-circle-outline" />
                        <Text style={styles.sectionDesc}>Posez une question ouverte sur les événements du campus.</Text>
                        <TextInput
                            style={[styles.input, styles.inputArea]}
                            value={qaQuestion}
                            onChangeText={setQaQuestion}
                            placeholder="ex: Quels événements sont utiles pour une carrière en data science ?"
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={[styles.actionBtn, (anyLoading || !qaQuestion.trim()) && styles.actionBtnDisabled]}
                            onPress={handleQA}
                            disabled={anyLoading || !qaQuestion.trim()}
                        >
                            {qa.loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>Poser la question</Text>}
                        </TouchableOpacity>

                        {qa.loading && <AILoadingState />}
                        {qa.error && <AIErrorState message={qa.error} onRetry={handleQA} />}
                        {qa.result !== null && !qa.loading && !qa.error && (
                            <View style={styles.qaBox}>
                                <Text style={styles.qaAnswer}>{qa.result.answer}</Text>
                                {qa.result.relevantEvents.length > 0 && (
                                    <>
                                        <Text style={styles.qaRelatedTitle}>Événements mentionnés :</Text>
                                        {qa.result.relevantEvents.map((e, i) => (
                                            <View key={i} style={styles.qaEventRow}>
                                                <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                                                <Text style={styles.qaEventTitle}>{e.title}</Text>
                                            </View>
                                        ))}
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    warningBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.warningLight, paddingHorizontal: 16, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    warningText: { fontSize: 12, color: Colors.warning, fontWeight: '500', flex: 1 },

    tabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    tab: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
        paddingHorizontal: 16, height: 36, borderRadius: Radius.full,
        backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    },
    tabActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    tabText: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
    tabTextActive: { color: Colors.primary, fontWeight: '700' },

    content: { padding: 16, paddingBottom: 40 },
    section: { gap: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
    sectionDesc: { ...Typography.bodySmall, color: Colors.textMuted },

    inputRow: {},
    input: {
        backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
        borderColor: Colors.border, padding: 12, fontSize: 14, color: Colors.text, minHeight: 48,
    },
    inputArea: { minHeight: 100, textAlignVertical: 'top' },

    actionBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.md,
        paddingVertical: 14, alignItems: 'center', ...Shadow.sm,
    },
    actionBtnDisabled: { opacity: 0.5 },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // State boxes
    stateBox: { alignItems: 'center', padding: 20, gap: 8, backgroundColor: Colors.surface, borderRadius: Radius.md, ...Shadow.sm },
    stateText: { ...Typography.bodySmall, color: Colors.textMuted },
    errorBox: { borderWidth: 1, borderColor: Colors.dangerLight },
    errorText: { ...Typography.bodySmall, color: Colors.danger, textAlign: 'center' },
    retryBtn: { backgroundColor: Colors.danger, paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.full },
    retryText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Search results
    resultCard: {
        flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md,
        padding: 14, ...Shadow.sm, gap: 10,
    },
    relevanceDot: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
    dotHigh: { backgroundColor: Colors.primary },
    dotMed: { backgroundColor: Colors.textMuted },
    resultBody: { flex: 1, gap: 3 },
    relevanceLabel: { fontSize: 11, fontWeight: '600' },
    labelHigh: { color: Colors.primary },
    labelMed: { color: Colors.textMuted },
    resultTitle: { ...Typography.label, fontSize: 15 },
    resultJustification: { ...Typography.bodySmall, fontStyle: 'italic', fontSize: 13 },

    // Reco cards
    recoCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, ...Shadow.sm, gap: 4,
    },
    recoHeader: { flexDirection: 'row' },
    recoCategoryBadge: {
        backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
    },
    recoCategoryText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
    recoTitle: { ...Typography.label, fontSize: 15 },
    recoDate: { ...Typography.bodySmall, fontSize: 12 },
    recoJustification: { color: Colors.primary, fontSize: 13, fontWeight: '500' },

    // Planning
    planBox: {
        backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, ...Shadow.sm, gap: 10,
    },
    planBoxTitle: { ...Typography.label, color: Colors.textSecondary, fontSize: 12 },
    planRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    planDot: { width: 3, marginTop: 6, height: 40, backgroundColor: Colors.primary, borderRadius: 2 },
    planDate: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
    planTitle: { ...Typography.label, fontSize: 14 },
    planNote: { ...Typography.bodySmall, fontSize: 12 },
    conflictRow: {
        flexDirection: 'row', gap: 6, alignItems: 'center',
        backgroundColor: Colors.warningLight, borderRadius: Radius.sm, padding: 10,
    },
    conflictText: { fontSize: 12, color: Colors.warning, flex: 1 },

    // Q&A
    qaBox: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, ...Shadow.sm, gap: 10 },
    qaAnswer: { ...Typography.body, lineHeight: 24 },
    qaRelatedTitle: { ...Typography.label, fontSize: 13, color: Colors.textSecondary },
    qaEventRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    qaEventTitle: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
});
