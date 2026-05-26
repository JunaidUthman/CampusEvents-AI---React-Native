import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Alert, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEventById, Event } from '../../../database/events';
import { isRegistered, registerForEvent, cancelRegistration } from '../../../database/registrations';
import { isFavorite, addFavorite, removeFavorite } from '../../../database/favorites';
import { useAuth } from '../../../context/AuthContext';
import { CategoryBadge } from '../../../components/CategoryBadge';
import { EmptyState } from '../../../components/States';
import { Colors, Typography, Radius, Shadow } from '../../../constants/theme';

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [registered, setRegistered] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [busy, setBusy] = useState(false);

    useFocusEffect(useCallback(() => {
        if (!id || !user) return;
        getEventById(id).then(evt => {
            setEvent(evt);
            if (evt) {
                Promise.all([
                    isRegistered(evt.id, user.email),
                    isFavorite(evt.id, user.email)
                ]).then(([reg, fav]) => {
                    setRegistered(reg);
                    setFavorited(fav);
                });
            }
        });
    }, [id, user]));

    if (!event) {
        return <EmptyState icon="calendar-outline" title="Événement introuvable" />;
    }

    const isPast = new Date(event.startDateTime) < new Date();
    const isFull = event.capacity != null && event.registeredCount >= event.capacity;
    const canRegister = !isPast && !isFull;

    async function handleRegistration() {
        if (!user || busy || !event) return;
        setBusy(true);
        if (registered) {
            Alert.alert("Annuler l'inscription ?", "Êtes-vous sûr ?", [
                { text: 'Non', style: 'cancel', onPress: () => setBusy(false) },
                {
                    text: 'Oui', style: 'destructive', onPress: async () => {
                        await cancelRegistration(event!.id, user.email);
                        const updated = await getEventById(event!.id);
                        setEvent(updated);
                        setRegistered(false);
                        setBusy(false);
                    }
                },
            ]);
        } else {
            await registerForEvent(event.id, user.email);
            const updated = await getEventById(event.id);
            setEvent(updated);
            setRegistered(true);
            setBusy(false);
        }
    }

    async function handleFavorite() {
        if (!user) return;
        if (favorited) {
            await removeFavorite(event!.id, user.email);
        } else {
            await addFavorite(event!.id, user.email);
        }
        setFavorited(f => !f);
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Icon */}
                <View style={styles.iconWrap}>
                    <Ionicons name="calendar-outline" size={36} color={Colors.primary} />
                </View>

                <CategoryBadge category={event.category} size="md" />
                <Text style={styles.title}>{event.title}</Text>
                {event.tags && event.tags.length > 0 && (
                    <View style={styles.tags}>
                        {event.tags.map(t => (
                            <View key={t} style={styles.tag}>
                                <Text style={styles.tagText}>{t}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Details grid */}
                <View style={styles.grid}>
                    <InfoBox label="Date" value={formatDate(event.startDateTime)} icon="calendar" />
                    <InfoBox label="Lieu" value={event.locationName} icon="location" />
                    <InfoBox label="Organisateur" value={event.organizerName} icon="people" />
                    {event.capacity != null && (
                        <InfoBox
                            label="Places"
                            value={`${event.registeredCount} / ${event.capacity}`}
                            icon="person"
                        />
                    )}
                </View>

                {event.endDateTime && (
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.infoRowText}>Jusqu'à {formatDate(event.endDateTime)}</Text>
                    </View>
                )}
                {event.locationAddress && (
                    <View style={styles.infoRow}>
                        <Ionicons name="navigate-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.infoRowText}>{event.locationAddress}</Text>
                    </View>
                )}

                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.description}>{event.description}</Text>

                {isPast && (
                    <View style={styles.pastBanner}>
                        <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                        <Text style={styles.pastText}>Cet événement est terminé</Text>
                    </View>
                )}
                {isFull && !isPast && (
                    <View style={styles.fullBanner}>
                        <Ionicons name="warning-outline" size={16} color={Colors.warning} />
                        <Text style={styles.fullText}>Capacité maximale atteinte</Text>
                    </View>
                )}
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[
                        styles.registerBtn,
                        registered && styles.registerBtnCancel,
                        (!canRegister && !registered) && styles.registerBtnDisabled,
                    ]}
                    onPress={handleRegistration}
                    disabled={(!canRegister && !registered) || busy}
                    activeOpacity={0.85}
                >
                    {busy
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.registerText}>
                            {registered ? "Annuler l'inscription" : "S'inscrire"}
                        </Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={styles.favBtn} onPress={handleFavorite} activeOpacity={0.85}>
                    <Ionicons name={favorited ? 'star' : 'star-outline'} size={18} color={favorited ? '#F59E0B' : Colors.primary} />
                    <Text style={[styles.favText, favorited && styles.favTextActive]}>
                        {favorited ? 'Favori' : 'Favori'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 20, gap: 12, paddingBottom: 30 },
    iconWrap: {
        alignSelf: 'center', width: 68, height: 68, borderRadius: 34,
        backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
        marginBottom: 4, ...Shadow.sm,
    },
    title: { ...Typography.h2, fontSize: 24, marginTop: 6 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
        backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    tagText: { fontSize: 11, color: Colors.textSecondary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    infoBox: {
        flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: Radius.md,
        padding: 12, ...Shadow.sm,
    },
    infoLabel: { ...Typography.caption, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { ...Typography.label, fontSize: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoRowText: { ...Typography.bodySmall, fontSize: 13 },
    descriptionTitle: { ...Typography.h3, fontSize: 16, marginTop: 8 },
    description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },
    pastBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: 12,
    },
    pastText: { ...Typography.bodySmall, color: Colors.textMuted },
    fullBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: 12,
    },
    fullText: { ...Typography.bodySmall, color: Colors.warning },
    actions: {
        flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 24,
        borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface,
    },
    registerBtn: {
        flex: 2, backgroundColor: Colors.primary, borderRadius: Radius.md,
        paddingVertical: 15, alignItems: 'center', ...Shadow.sm,
    },
    registerBtnCancel: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
    registerBtnDisabled: { backgroundColor: Colors.textMuted },
    registerText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    favBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary,
        paddingVertical: 15, backgroundColor: Colors.surface,
    },
    favText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
    favTextActive: { color: '#F59E0B' },
});
