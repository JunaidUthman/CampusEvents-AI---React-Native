import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../database/events';
import { CategoryBadge } from './CategoryBadge';
import { Colors, Typography, Radius, Shadow } from '../constants/theme';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

interface Props {
    event: Event;
    isFavorite?: boolean;
    onPress?: () => void;
    onFavoriteToggle?: () => void;
}

export function EventCard({ event, isFavorite, onPress, onFavoriteToggle }: Props) {
    const isPast = new Date(event.startDateTime) < new Date();
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <CategoryBadge category={event.category} />
                </View>
                {onFavoriteToggle && (
                    <TouchableOpacity onPress={onFavoriteToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons
                            name={isFavorite ? 'star' : 'star-outline'}
                            size={20}
                            color={isFavorite ? '#F59E0B' : Colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={[styles.title, isPast && styles.pastTitle]} numberOfLines={2}>{event.title}</Text>
            <View style={styles.meta}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{formatDate(event.startDateTime)}</Text>
            </View>
            <View style={styles.meta}>
                <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{event.locationName}</Text>
                {event.capacity != null && (
                    <Text style={styles.capacity}>
                        {' · '}{event.registeredCount}/{event.capacity} inscrits
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        padding: 16,
        marginBottom: 10,
        ...Shadow.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerLeft: { flex: 1 },
    title: { ...Typography.h3, fontSize: 16, marginBottom: 6 },
    pastTitle: { color: Colors.textSecondary },
    meta: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    metaText: { ...Typography.bodySmall, fontSize: 12 },
    capacity: { ...Typography.caption, fontSize: 12, color: Colors.textMuted },
});
