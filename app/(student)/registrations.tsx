import React, { useCallback, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRegistrationsByUser, cancelRegistration, Registration } from '../../database/registrations';
import { getEventById } from '../../database/events';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/States';
import { Colors, Typography, Radius, Shadow } from '../../constants/theme';

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

type RegistrationWithEvent = Registration & { eventTitle: string; eventDate: string; eventLocation: string };

export default function RegistrationsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<RegistrationWithEvent[]>([]);

    useFocusEffect(useCallback(() => {
        if (!user) return;
        getRegistrationsByUser(user.email).then(async regs => {
            const enriched = await Promise.all(regs.map(async r => {
                const event = await getEventById(r.eventId);
                return {
                    ...r,
                    eventTitle: event?.title ?? 'Événement supprimé',
                    eventDate: event ? formatDate(event.startDateTime) : '',
                    eventLocation: event?.locationName ?? '',
                };
            }));
            setItems(enriched);
        });
    }, [user]));

    function handleCancel(reg: RegistrationWithEvent) {
        Alert.alert(
            "Annuler l'inscription",
            `Annuler votre inscription à "${reg.eventTitle}" ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui', style: 'destructive', onPress: async () => {
                        await cancelRegistration(reg.eventId, user!.email);
                        setItems(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'cancelled' as const } : r));
                    }
                },
            ]
        );
    }

    function renderItem({ item }: { item: RegistrationWithEvent }) {
        const confirmed = item.status === 'confirmed';
        return (
            <TouchableOpacity
                style={styles.row}
                onPress={() => router.push({ pathname: '/(student)/events/[id]', params: { id: item.eventId } })}
                activeOpacity={0.75}
            >
                <View style={[styles.statusBadge, confirmed ? styles.badgeConfirmed : styles.badgeCancelled]}>
                    <Text style={[styles.statusText, confirmed ? styles.statusTextConfirmed : styles.statusTextCancelled]}>
                        {confirmed ? 'Confirmé' : 'Annulé'}
                    </Text>
                </View>
                <Text style={styles.title} numberOfLines={1}>{item.eventTitle}</Text>
                {item.eventDate ? (
                    <Text style={styles.meta}>{item.eventDate}{item.eventLocation ? ` · ${item.eventLocation}` : ''}</Text>
                ) : null}
                {confirmed && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <FlatList
                data={items}
                keyExtractor={r => r.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyState
                        icon="checkmark-circle-outline"
                        title="Aucune inscription"
                        subtitle="Inscrivez-vous à des événements depuis le catalogue"
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    list: { padding: 16, gap: 10 },
    row: {
        backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, ...Shadow.sm,
    },
    statusBadge: {
        alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: Radius.full, marginBottom: 8,
    },
    badgeConfirmed: { backgroundColor: Colors.successLight },
    badgeCancelled: { backgroundColor: Colors.surfaceAlt },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextConfirmed: { color: Colors.success },
    statusTextCancelled: { color: Colors.textMuted },
    title: { ...Typography.label, fontSize: 16, marginBottom: 4 },
    meta: { ...Typography.bodySmall, fontSize: 13 },
    cancelBtn: {
        marginTop: 10, borderWidth: 1, borderColor: Colors.border,
        borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center',
        backgroundColor: Colors.bg,
    },
    cancelText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
