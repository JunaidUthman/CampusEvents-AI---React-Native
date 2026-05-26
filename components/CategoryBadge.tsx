import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Event } from '../database/events';
import { Colors, Typography, Radius } from '../constants/theme';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    Talk: { bg: '#EEF2FF', text: '#4338CA' },
    Workshop: { bg: '#ECFDF5', text: '#065F46' },
    Club: { bg: '#FEF3C7', text: '#92400E' },
    Exam: { bg: '#FEE2E2', text: '#991B1B' },
    Other: { bg: '#F3F4F6', text: '#374151' },
};

interface Props {
    category: Event['category'];
    size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: Props) {
    const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }, size === 'md' && styles.badgeMd]}>
            <Text style={[styles.text, { color: colors.text }, size === 'md' && styles.textMd]}>
                {category}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 100,
    },
    badgeMd: {
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    text: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    textMd: {
        fontSize: 13,
    },
});
