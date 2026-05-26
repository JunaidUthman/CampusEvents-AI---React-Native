export const Colors = {
    primary: '#1D4ED8',
    primaryLight: '#EFF6FF',
    primaryDark: '#1E40AF',
    accent: '#7C3AED',
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    danger: '#DC2626',
    dangerLight: '#FEF2F2',

    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    tabBarActive: '#1D4ED8',
    tabBarInactive: '#94A3B8',
};

export const Typography = {
    h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
    body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text, lineHeight: 22 },
    bodySmall: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    caption: { fontSize: 11, color: Colors.textMuted },
    label: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
};

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 100,
};

export const Shadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
};
