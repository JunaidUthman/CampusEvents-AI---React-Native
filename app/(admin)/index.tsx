import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Alert, SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEvents, deleteEvent, Event } from '../../database/events';
import { Colors, Typography, Radius, Shadow } from '../../constants/theme';

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminEventsScreen() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);

    useFocusEffect(useCallback(() => {
        getEvents().then(setEvents);
    }, []));

    function handleDelete(id: string, title: string) {
        Alert.alert(
            "Supprimer l'événement",
            `Êtes-vous sûr de vouloir supprimer "${title}" ? Cette action est irréversible.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive', onPress: () => {
                        deleteEvent(id).then(() => {
                            setEvents(prev => prev.filter(e => e.id !== id));
                        });
                    }
                },
            ]
        );
    }

    function renderItem({ item }: { item: Event }) {
        const isPast = new Date(item.startDateTime) < new Date();
        return (
            <View style={styles.row}>
                <View style={styles.rowInfo}>
                    <Text style={[styles.rowTitle, isPast && styles.pastTitle]} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.rowMeta}>{formatDate(item.startDateTime)} · {item.locationName}</Text>
                    <Text style={styles.rowCategory}>{item.category}</Text>
                </View>
                <View style={styles.rowActions}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => router.push({ pathname: '/(admin)/edit/[id]', params: { id: item.id } })}
                    >
                        <Text style={styles.editText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
                        <Text style={styles.deleteText}>Suppr.</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(admin)/create')}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createText}>Créer un événement</Text>
            </TouchableOpacity>

            <FlatList
                data={events}
                keyExtractor={e => e.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>Aucun événement</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    createBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: Colors.primary, margin: 16, borderRadius: Radius.md,
        paddingVertical: 14, ...Shadow.sm,
    },
    createText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    list: { paddingHorizontal: 16, paddingBottom: 16 },
    row: {
        flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md,
        padding: 14, marginBottom: 10, alignItems: 'center', ...Shadow.sm,
    },
    rowInfo: { flex: 1, gap: 2, paddingRight: 8 },
    rowTitle: { ...Typography.label, fontSize: 14 },
    pastTitle: { color: Colors.textSecondary },
    rowMeta: { ...Typography.bodySmall, fontSize: 12 },
    rowCategory: { ...Typography.caption, color: Colors.textMuted, fontSize: 11 },
    rowActions: { flexDirection: 'row', gap: 6 },
    editBtn: {
        backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.primary + '40',
    },
    editText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
    deleteBtn: {
        backgroundColor: Colors.dangerLight, paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.danger + '40',
    },
    deleteText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
    empty: { alignItems: 'center', marginTop: 80, gap: 12 },
    emptyText: { ...Typography.bodySmall, color: Colors.textMuted },
});
