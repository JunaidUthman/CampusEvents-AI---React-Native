import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEvents, Event } from '../../../database/events';
import { addFavorite, removeFavorite, getFavoritesByUser } from '../../../database/favorites';
import { useAuth } from '../../../context/AuthContext';
import { EventCard } from '../../../components/EventCard';
import { EmptyState, LoadingState } from '../../../components/States';
import { Colors, Typography, Radius } from '../../../constants/theme';

type Category = 'Tous' | 'Talk' | 'Workshop' | 'Club' | 'Exam' | 'Other';
type Period = 'upcoming' | 'past' | 'all';

const CATEGORIES: Category[] = ['Tous', 'Talk', 'Workshop', 'Club', 'Exam', 'Other'];

export default function EventsCatalogueScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<Category>('Tous');
    const [period, setPeriod] = useState<'upcoming' | 'past'>('upcoming');
    const [events, setEvents] = useState<Event[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        (async () => {
            const evts = await getEvents({ category, period, search: search || undefined });
            setEvents(evts);
            if (user) {
                const favs = await getFavoritesByUser(user.email);
                setFavoriteIds(new Set(favs.map(f => f.eventId)));
            }
            setLoading(false);
        })();
    }, [category, period, search, user]));

    async function toggleFavorite(eventId: string) {
        if (!user) return;
        if (favoriteIds.has(eventId)) {
            await removeFavorite(eventId, user.email);
            setFavoriteIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
        } else {
            await addFavorite(eventId, user.email);
            setFavoriteIds(prev => new Set([...prev, eventId]));
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            {/* Search bar */}
            <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.search}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Rechercher un événement…"
                    placeholderTextColor={Colors.textMuted}
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category chips */}
            <View style={styles.filters}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={c => c}
                    renderItem={({ item: c }) => (
                        <TouchableOpacity
                            style={[styles.chip, category === c && styles.chipActive]}
                            onPress={() => setCategory(c)}
                        >
                            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.chipsRow}
                />
            </View>

            {/* Period toggle */}
            <View style={styles.periodRow}>
                {(['upcoming', 'past'] as const).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                            {p === 'upcoming' ? 'À venir' : 'Passés'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <LoadingState />
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={e => e.id}
                    renderItem={({ item }) => (
                        <EventCard
                            event={item}
                            isFavorite={favoriteIds.has(item.id)}
                            onPress={() => router.push({ pathname: '/(student)/events/[id]', params: { id: item.id } })}
                            onFavoriteToggle={() => toggleFavorite(item.id)}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <EmptyState
                            icon="calendar-outline"
                            title="Aucun événement trouvé"
                            subtitle={search ? `Aucun résultat pour "${search}"` : 'Essayez de changer les filtres'}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8,
        backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
        borderColor: Colors.border, paddingHorizontal: 12,
    },
    searchIcon: { marginRight: 8 },
    search: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.text },
    filters: {},
    chipsRow: { paddingHorizontal: 16, gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
        backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    periodRow: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 10, gap: 8 },
    periodBtn: {
        paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full,
        backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    },
    periodBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
    periodText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
    periodTextActive: { color: Colors.primary, fontWeight: '700' },
    list: { paddingHorizontal: 16, paddingBottom: 16 },
});
