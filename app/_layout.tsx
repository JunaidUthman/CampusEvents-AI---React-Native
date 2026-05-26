import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { initDatabase } from '../database/init';
import { seedDemoData } from '../database/seed';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutInner() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (isLoading) return;
        const inAuth = segments[0] === 'login';
        if (!user && !inAuth) {
            router.replace('/login');
        } else if (user && inAuth) {
            if (user.role === 'admin') {
                router.replace('/(admin)');
            } else {
                router.replace('/(student)/events');
            }
        }
    }, [user, isLoading, segments]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(student)" />
        </Stack>
    );
}

export default function RootLayout() {
    useEffect(() => {
        (async () => {
            await initDatabase();
            await seedDemoData();
        })();
    }, []);

    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <RootLayoutInner />
        </AuthProvider>
    );
}
