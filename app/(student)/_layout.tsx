import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function StudentLayout() {
    const { logout } = useAuth();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.tabBarActive,
                tabBarInactiveTintColor: Colors.tabBarInactive,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.text,
                headerShadowVisible: false,
                headerRight: () => (
                    <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
                        <Ionicons name="log-out-outline" size={24} color={Colors.text} />
                    </TouchableOpacity>
                ),
            }}
        >
            <Tabs.Screen
                name="events"
                options={{
                    title: 'Événements',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favoris',
                    headerTitle: 'Mes favoris',
                    tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="registrations"
                options={{
                    title: 'Inscriptions',
                    headerTitle: 'Mes inscriptions',
                    tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="assistant"
                options={{
                    title: 'Assistant',
                    headerTitle: 'Assistant IA',
                    tabBarIcon: ({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
