import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDevice } from '../app/device-context';

export const LIGHT_COLORS = {
  background: '#FAFAFD',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  card: '#FFFFFF',
  cardHover: '#F8FAFC',
  border: '#E5E7EB',
  borderHover: '#C7D2FE',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#EEF2FF',
  gradientStart: '#FADA61',
  gradientMid: '#FF9188',
  gradientEnd: '#FF5ACD',
  badgeBg: '#EEF2FF',
  badgeBorder: '#C7D2FE',
  badgeText: '#4338CA',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  successText: '#047857',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#B45309',
  shadow: 'rgba(0, 0, 0, 0.06)'
};

export const DARK_COLORS = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  card: '#1E293B',
  cardHover: '#24334A',
  border: '#334155',
  borderHover: '#6366F1',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#1E1B4B',
  gradientStart: '#FADA61',
  gradientMid: '#FF9188',
  gradientEnd: '#FF5ACD',
  badgeBg: 'rgba(99, 102, 241, 0.15)',
  badgeBorder: 'rgba(99, 102, 241, 0.35)',
  badgeText: '#A5B4FC',
  successBg: 'rgba(16, 185, 129, 0.15)',
  successBorder: 'rgba(16, 185, 129, 0.35)',
  successText: '#34D399',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  warningBorder: 'rgba(245, 158, 11, 0.35)',
  warningText: '#FBBF24',
  shadow: 'rgba(0, 0, 0, 0.4)'
};

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  colors: LIGHT_COLORS,
  isDark: false
});

const THEME_STORAGE_KEY = 'loreboards_theme_mode';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setMode(saved);
        }
      } catch (e) {
        // Fallback to light
      }
    };
    loadSavedTheme();
  }, []);

  const toggleTheme = async () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (e) {
      // Ignore write errors
    }
  };

  const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const isDark = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  const { isDesktopWeb } = useDevice();
  const colors = context?.colors || LIGHT_COLORS;
  const isDark = context?.isDark || false;

  const dynamicStyles = useMemo(() => {
    return StyleSheet.create({
      scrollContainer: {
        backgroundColor: colors.background,
        flexGrow: 1,
        justifyContent: 'space-between'
      },
      mainContainer: {
        padding: isDesktopWeb ? 30 : 16,
        maxWidth: 1280,
        width: '100%',
        marginHorizontal: 'auto'
      },
      title: {
        fontSize: isDesktopWeb ? 34 : 26,
        fontWeight: '800',
        color: colors.text,
        marginTop: isDesktopWeb ? 20 : 10,
        marginBottom: 16,
        letterSpacing: -0.5
      },
      subtitle: {
        fontSize: isDesktopWeb ? 18 : 15,
        fontWeight: '500',
        color: colors.textMuted,
        marginBottom: 24,
        lineHeight: 24
      },
      body: {
        fontSize: 15,
        fontWeight: '400',
        color: colors.text,
        marginBottom: 16,
        lineHeight: 22
      },
      link: {
        color: colors.primary,
        fontWeight: '600'
      },
      card: {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2
      },
      input: {
        backgroundColor: colors.surfaceSecondary,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: colors.text
      }
    });
  }, [colors, isDesktopWeb]);

  return {
    ...context,
    colors,
    isDark,
    styles: dynamicStyles,
    // Backward compatibility helpers
    scrollContainer: dynamicStyles.scrollContainer,
    mainContainer: dynamicStyles.mainContainer,
    title: dynamicStyles.title,
    subtitle: dynamicStyles.subtitle,
    body: dynamicStyles.body,
    link: dynamicStyles.link
  };
}
