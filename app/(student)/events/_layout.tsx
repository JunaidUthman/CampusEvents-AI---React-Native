import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';

export default function EventsLayout() {
    const { logout } = useAuth();
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.text,
                headerShadowVisible: false,
                headerBackTitle: 'Retour',
                headerRight: () => (
                    <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
                        <Ionicons name="log-out-outline" size={24} color={Colors.text} />
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Événements' }} />
            <Stack.Screen name="[id]" options={{ title: 'Détail' }} />
        </Stack>
    );
}
