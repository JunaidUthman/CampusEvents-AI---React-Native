import React, { useCallback, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFavoritesByUser, removeFavorite, Favorite } from '../../database/favorites';
import { getEventById, Event } from '../../database/events';
import { useAuth } from '../../context/AuthContext';
import { EventCard } from '../../components/EventCard';
import { EmptyState } from '../../components/States';
import { Colors } from '../../constants/theme';

export default function FavoritesScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<(Favorite & { event: Event })[]>([]);

    useFocusEffect(useCallback(() => {
        if (user) {
            getFavoritesByUser(user.email).then(setItems);
        }
    }, [user]));

    async function handleRemove(eventId: string) {
        if (!user) return;
        await removeFavorite(eventId, user.email);
        setItems(prev => prev.filter(f => f.eventId !== eventId));
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
            <FlatList
                data={items}
                keyExtractor={f => f.eventId}
                renderItem={({ item }) =>
                    item.event ? (
                        <EventCard
                            event={item.event}
                            isFavorite
                            onPress={() => router.push({ pathname: '/(student)/events/[id]', params: { id: item.eventId } })}
                            onFavoriteToggle={() => handleRemove(item.eventId)}
                        />
                    ) : null
                }
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <EmptyState
                        icon="star-outline"
                        title="Aucun favori"
                        subtitle="Ajoutez des événements à vos favoris depuis le catalogue"
                    />
                }
            />
        </SafeAreaView>
    );
}
