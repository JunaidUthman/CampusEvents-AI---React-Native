import React from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';

export default function AdminLayout() {
    const { logout } = useAuth();
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.text,
                headerShadowVisible: false,
                headerRight: () => (
                    <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
                        <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Admin — Événements' }} />
            <Stack.Screen name="create" options={{ title: 'Créer un événement' }} />
            <Stack.Screen name="edit/[id]" options={{ title: 'Modifier un événement' }} />
        </Stack>
    );
}
