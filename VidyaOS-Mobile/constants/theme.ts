/**
 * VidyaOS Mobile Design System Tokens
 * Perfectly harmonized with VidyaOS web CSS tokens
 */

export const THEME = {
  colors: {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#EFF6FF',
    primaryFocus: '#3B82F6',

    // Role Brand Colors
    roleStudent: '#2563EB',
    roleFaculty: '#059669',
    roleAdmin: '#7C3AED',
    roleHOD: '#D97706',

    // Canvas & Cards
    background: '#F8FAFC',
    card: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    surfaceHover: '#E2E8F0',

    // Headers & Navigation Dark Themes (from VidyaOS Mobile header)
    navyDeep: '#0F172A',
    navyHeader: '#1E293B',
    navyBorder: '#334155',

    // Text & Typography
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    // Borders & Dividers
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',

    // Status / Attendance Badges
    present: '#16A34A',
    presentBg: '#DCFCE7',
    absent: '#DC2626',
    absentBg: '#FEE2E2',
    late: '#D97706',
    lateBg: '#FEF3C7',
    excused: '#0284C7',
    excusedBg: '#E0F2FE',

    // UI Feedback
    success: '#16A34A',
    danger: '#DC2626',
    error: '#DC2626',
    warning: '#D97706',
    info: '#2563EB',
    surface: '#F8FAFC',

    // Bug Report Status Badges
    statusNew: '#3B82F6',
    statusUnderReview: '#8B5CF6',
    statusInProgress: '#F59E0B',
    statusResolved: '#10B981',
    statusRejected: '#EF4444',
  },

  typography: {
    fontFamilies: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 24,
      xxl: 30,
    },
    weights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extraBold: '800' as const,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    elevated: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    header: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
  },
};

