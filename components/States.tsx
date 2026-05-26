import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '../constants/theme';

export function LoadingState({ message = 'Chargement…' }: { message?: string }) {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.danger} />
            <Text style={styles.errorTitle}>Une erreur est survenue</Text>
            <Text style={styles.errorMessage}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                    <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export function EmptyState({ icon = 'calendar-outline', title, subtitle }: {
    icon?: string; title: string; subtitle?: string;
}) {
    return (
        <View style={styles.center}>
            <Ionicons name={icon as any} size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>{title}</Text>
            {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    message: { ...Typography.bodySmall, marginTop: 8 },
    errorTitle: { ...Typography.h3, color: Colors.danger },
    errorMessage: { ...Typography.bodySmall, textAlign: 'center', color: Colors.textSecondary },
    retryBtn: {
        marginTop: 12, backgroundColor: Colors.primary,
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full,
    },
    retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    emptyTitle: { ...Typography.h3, color: Colors.textSecondary, fontSize: 16 },
    emptySubtitle: { ...Typography.bodySmall, textAlign: 'center' },
});
