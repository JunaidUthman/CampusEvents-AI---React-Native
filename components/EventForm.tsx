import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../database/events';
import { Colors, Typography, Radius, Shadow } from '../constants/theme';

export type EventFormData = {
    title: string;
    description: string;
    category: Event['category'];
    startDateTime: string;
    endDateTime: string;
    locationName: string;
    locationAddress: string;
    organizerName: string;
    capacity: string;
    tags: string;
};

const CATEGORIES: Event['category'][] = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'];

interface Props {
    initialData?: Partial<EventFormData>;
    onSubmit: (data: EventFormData) => void;
    submitLabel: string;
    isLoading?: boolean;
}

export function EventForm({ initialData, onSubmit, submitLabel, isLoading }: Props) {
    const [form, setForm] = useState<EventFormData>({
        title: initialData?.title ?? '',
        description: initialData?.description ?? '',
        category: initialData?.category ?? 'Other',
        startDateTime: initialData?.startDateTime ?? '',
        endDateTime: initialData?.endDateTime ?? '',
        locationName: initialData?.locationName ?? '',
        locationAddress: initialData?.locationAddress ?? '',
        organizerName: initialData?.organizerName ?? '',
        capacity: initialData?.capacity ?? '',
        tags: initialData?.tags ?? '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

    function update(key: keyof EventFormData, value: string) {
        setForm(f => ({ ...f, [key]: value }));
        setErrors(e => ({ ...e, [key]: undefined }));
    }

    function validate(): boolean {
        const errs: Partial<Record<keyof EventFormData, string>> = {};
        if (!form.title.trim()) errs.title = 'Le titre est requis.';
        if (!form.description.trim()) errs.description = 'La description est requise.';
        if (!form.locationName.trim()) errs.locationName = 'Le lieu est requis.';
        if (!form.startDateTime.trim()) {
            errs.startDateTime = 'La date de début est requise.';
        } else if (isNaN(Date.parse(form.startDateTime))) {
            errs.startDateTime = 'Format invalide. Utilisez JJ/MM/AAAA HH:MM';
        }
        if (form.endDateTime.trim()) {
            if (isNaN(Date.parse(form.endDateTime))) {
                errs.endDateTime = 'Format invalide.';
            } else if (new Date(form.endDateTime) <= new Date(form.startDateTime)) {
                errs.endDateTime = 'La date de fin doit être après la date de début.';
            }
        }
        if (form.capacity.trim()) {
            const cap = parseInt(form.capacity, 10);
            if (isNaN(cap) || cap <= 0) errs.capacity = 'La capacité doit être un entier positif.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit() {
        if (validate()) onSubmit(form);
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Field label="Titre *" error={errors.title}>
                <TextInput
                    style={[styles.input, errors.title && styles.inputError]}
                    value={form.title}
                    onChangeText={v => update('title', v)}
                    placeholder="ex: Conférence IA Générative"
                    placeholderTextColor={Colors.textMuted}
                />
            </Field>

            <Field label="Description *" error={errors.description}>
                <TextInput
                    style={[styles.input, styles.textarea, errors.description && styles.inputError]}
                    value={form.description}
                    onChangeText={v => update('description', v)}
                    multiline
                    numberOfLines={4}
                    placeholder="Décrivez l'événement…"
                    placeholderTextColor={Colors.textMuted}
                    textAlignVertical="top"
                />
            </Field>

            <Field label="Catégorie *" error={errors.category}>
                <View style={styles.chips}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.chip, form.category === cat && styles.chipActive]}
                            onPress={() => update('category', cat)}
                        >
                            <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Field>

            <Field label="Date et heure de début * (AAAA-MM-JJ HH:MM)" error={errors.startDateTime}>
                <TextInput
                    style={[styles.input, errors.startDateTime && styles.inputError]}
                    value={form.startDateTime}
                    onChangeText={v => update('startDateTime', v)}
                    placeholder="2026-04-20 14:00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="default"
                />
            </Field>

            <Field label="Date et heure de fin (optionnel)" error={errors.endDateTime}>
                <TextInput
                    style={[styles.input, errors.endDateTime && styles.inputError]}
                    value={form.endDateTime}
                    onChangeText={v => update('endDateTime', v)}
                    placeholder="2026-04-20 16:00"
                    placeholderTextColor={Colors.textMuted}
                />
            </Field>

            <Field label="Lieu *" error={errors.locationName}>
                <TextInput
                    style={[styles.input, errors.locationName && styles.inputError]}
                    value={form.locationName}
                    onChangeText={v => update('locationName', v)}
                    placeholder="ex: Amphi A"
                    placeholderTextColor={Colors.textMuted}
                />
            </Field>

            <Field label="Adresse du lieu (optionnel)" error={errors.locationAddress}>
                <TextInput
                    style={styles.input}
                    value={form.locationAddress}
                    onChangeText={v => update('locationAddress', v)}
                    placeholder="ex: Bâtiment principal"
                    placeholderTextColor={Colors.textMuted}
                />
            </Field>

            <Field label="Organisateur *" error={errors.organizerName}>
                <TextInput
                    style={[styles.input, errors.organizerName && styles.inputError]}
                    value={form.organizerName}
                    onChangeText={v => update('organizerName', v)}
                    placeholder="ex: Club IA"
                    placeholderTextColor={Colors.textMuted}
                />
            </Field>

            <Field label="Capacité maximale (optionnel)" error={errors.capacity}>
                <TextInput
                    style={[styles.input, errors.capacity && styles.inputError]}
                    value={form.capacity}
                    onChangeText={v => update('capacity', v)}
                    keyboardType="numeric"
                    placeholder="ex: 50"
                    placeholderTextColor={Colors.textMuted}
                />
            </Field>

            <Field label="Tags (optionnel, séparés par des virgules)" error={errors.tags}>
                <TextInput
                    style={styles.input}
                    value={form.tags}
                    onChangeText={v => update('tags', v)}
                    placeholder="ex: IA, machine learning, atelier"
                    placeholderTextColor={Colors.textMuted}
                />
            </Field>

            <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
            >
                <Text style={styles.submitText}>{submitLabel}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            {children}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 4, paddingBottom: 40 },
    field: { marginBottom: 14, gap: 6 },
    label: { ...Typography.label, fontSize: 13 },
    input: {
        backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
        borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: Colors.text,
    },
    textarea: { minHeight: 100 },
    inputError: { borderColor: Colors.danger },
    errorText: { fontSize: 12, color: Colors.danger },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
        backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    submitBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.md,
        paddingVertical: 15, alignItems: 'center', marginTop: 8, ...Shadow.sm,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
