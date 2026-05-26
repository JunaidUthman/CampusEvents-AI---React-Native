import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { EventForm, EventFormData } from '../../../components/EventForm';
import { getEventById, updateEvent, Event } from '../../../database/events';
import { Colors, Typography } from '../../../constants/theme';
import { LoadingState } from '../../../components/States';

export default function EditEventScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
        if (id) {
            getEventById(id).then(e => {
                setEvent(e);
                setLoading(false);
            });
        }
    }, [id]));

    if (loading) return <LoadingState />;

    if (!event) {
        return (
            <View style={styles.center}>
                <Text style={styles.notFound}>Événement introuvable.</Text>
            </View>
        );
    }

    const initialData: Partial<EventFormData> = {
        title: event.title,
        description: event.description,
        category: event.category,
        startDateTime: event.startDateTime
            ? new Date(event.startDateTime).toISOString().slice(0, 16).replace('T', ' ')
            : '',
        endDateTime: event.endDateTime
            ? new Date(event.endDateTime).toISOString().slice(0, 16).replace('T', ' ')
            : '',
        locationName: event.locationName,
        locationAddress: event.locationAddress ?? '',
        organizerName: event.organizerName,
        capacity: event.capacity?.toString() ?? '',
        tags: event.tags?.join(', ') ?? '',
    };

    async function handleSubmit(form: EventFormData) {
        const tags = form.tags.trim()
            ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
            : undefined;
        const capacity = form.capacity.trim() ? parseInt(form.capacity, 10) : undefined;

        await updateEvent(id!, {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            startDateTime: new Date(form.startDateTime.replace(' ', 'T')).toISOString(),
            endDateTime: form.endDateTime.trim()
                ? new Date(form.endDateTime.replace(' ', 'T')).toISOString()
                : undefined,
            locationName: form.locationName.trim(),
            locationAddress: form.locationAddress.trim() || undefined,
            organizerName: form.organizerName.trim(),
            capacity,
            tags,
        });

        Alert.alert('Succès', 'Événement mis à jour.', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    }

    return <EventForm initialData={initialData} onSubmit={handleSubmit} submitLabel="Enregistrer les modifications" />;
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    notFound: { ...Typography.body, color: Colors.textSecondary },
});
