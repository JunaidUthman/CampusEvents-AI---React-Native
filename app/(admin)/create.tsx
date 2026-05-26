import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { EventForm, EventFormData } from '../../components/EventForm';
import { createEvent } from '../../database/events';

export default function CreateEventScreen() {
    const router = useRouter();

    async function handleSubmit(form: EventFormData) {
        const tags = form.tags.trim()
            ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
            : undefined;
        const capacity = form.capacity.trim() ? parseInt(form.capacity, 10) : undefined;

        await createEvent({
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

        Alert.alert('Succès', 'Événement créé avec succès.', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    }

    return <EventForm onSubmit={handleSubmit} submitLabel="Créer l'événement" />;
}
