import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { LexendZetta_400Regular } from '@expo-google-fonts/lexend-zetta';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import * as SplashScreen from 'expo-splash-screen';
import WebTopNav from '../components/WebTopNav';
import { AuthProvider } from '../src/auth/AuthContext';
import { DeviceProvider, useDevice } from './device-context';

import { ThemeProvider, useTheme } from '../styles/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LexendZetta_400Regular,
    NotoSans_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <DeviceProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </DeviceProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isDesktopWeb } = useDevice();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, fontFamily: 'NotoSans_400Regular' }}>
      {isDesktopWeb && <WebTopNav />}
      <Stack
        screenOptions={{
          headerShown: !isDesktopWeb,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: 'LexendZetta_400Regular',
            color: colors.text,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="contact" options={{ title: 'Contact' }} />
        <Stack.Screen name="signup" options={{ title: 'Create Account' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
      </Stack>
    </View>
  );
}
