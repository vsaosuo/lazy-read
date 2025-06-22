/**
 * Minimalist color palette for Lazy Read app
 * Inspired by modern design principles with soft, readable colors
 */

const primaryColor = '#2563eb'; // Modern blue
const primaryDark = '#1d4ed8';
const secondaryColor = '#64748b'; // Subtle gray-blue
const accentColor = '#10b981'; // Success green

export const Colors = {
  light: {
    text: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    tint: primaryColor,
    tintSecondary: primaryDark,
    accent: accentColor,
    icon: secondaryColor,
    iconMuted: '#cbd5e1',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    shadow: '#64748b',
    destructive: '#ef4444',
    destructiveMuted: '#fef2f2',
    tabIconDefault: secondaryColor,
    tabIconSelected: primaryColor,
    success: accentColor,
    warning: '#f59e0b',
  },
  dark: {
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    backgroundTertiary: '#334155',
    tint: '#60a5fa',
    tintSecondary: '#3b82f6',
    accent: '#34d399',
    icon: '#cbd5e1',
    iconMuted: '#64748b',
    border: '#334155',
    borderLight: '#475569',
    shadow: '#000000',
    destructive: '#f87171',
    destructiveMuted: '#1f2937',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#60a5fa',
    success: '#34d399',
    warning: '#fbbf24',
  },
};
