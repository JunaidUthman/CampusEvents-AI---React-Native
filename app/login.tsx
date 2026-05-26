import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Radius, Shadow } from '../constants/theme';

type Role = 'admin' | 'student';

const ROLE_PREFILL: Record<Role, { email: string; password: string }> = {
    admin: { email: 'admin@campus.ma', password: 'admin123' },
    student: { email: 'etudiant@campus.ma', password: 'etudiant123' },
};

export default function LoginScreen() {
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState<Role>('student');
    const [email, setEmail] = useState(ROLE_PREFILL.student.email);
    const [password, setPassword] = useState(ROLE_PREFILL.student.password);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    function handleRoleSwitch(role: Role) {
        setSelectedRole(role);
        setEmail(ROLE_PREFILL[role].email);
        setPassword(ROLE_PREFILL[role].password);
    }

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
            return;
        }
        setLoading(true);
        const result = await login(email.trim(), password);
        setLoading(false);
        if (!result.success) {
            Alert.alert('Connexion échouée', result.error);
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="calendar" size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.appName}>CampusEvents AI</Text>
                        <Text style={styles.university}>Université Abdelmalek Essaâdi</Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        {/* Role Toggle */}
                        <View style={styles.toggle}>
                            {(['admin', 'student'] as Role[]).map(role => (
                                <TouchableOpacity
                                    key={role}
                                    style={[styles.toggleBtn, selectedRole === role && styles.toggleBtnActive]}
                                    onPress={() => handleRoleSwitch(role)}
                                >
                                    <Text style={[styles.toggleText, selectedRole === role && styles.toggleTextActive]}>
                                        {role === 'admin' ? 'Admin' : 'Étudiant'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="email@campus.ma"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Mot de passe</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.textMuted}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login button */}
                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.loginText}>Se connecter</Text>}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hint}>Démo — aucune inscription requise</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    kav: { flex: 1 },
    container: { flex: 1, padding: 24, justifyContent: 'center', gap: 24 },

    headerSection: { alignItems: 'center', gap: 8 },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
        ...Shadow.md,
    },
    appName: { ...Typography.h2, fontSize: 26, marginTop: 4 },
    university: { ...Typography.bodySmall, color: Colors.textMuted },

    card: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 24,
        gap: 16, ...Shadow.md,
    },

    toggle: {
        flexDirection: 'row', backgroundColor: Colors.bg,
        borderRadius: Radius.full, padding: 4,
    },
    toggleBtn: {
        flex: 1, paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center',
    },
    toggleBtnActive: { backgroundColor: Colors.surface, ...Shadow.sm },
    toggleText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
    toggleTextActive: { color: Colors.primary, fontWeight: '700' },

    fieldGroup: { gap: 6 },
    label: { ...Typography.label, fontSize: 13 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1,
        borderColor: Colors.border, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 13, fontSize: 15, color: Colors.text },
    eyeBtn: { padding: 4 },

    loginBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.md,
        paddingVertical: 15, alignItems: 'center', marginTop: 4, ...Shadow.sm,
    },
    loginText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    hint: { textAlign: 'center', ...Typography.caption, color: Colors.textMuted },
});
