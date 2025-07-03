import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { StorageService } from '@/services/storage';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Initialize storage service when app starts
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await StorageService.initialize();
        setStorageInitialized(true);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        setStorageInitialized(true); // Continue even if there's an error
      }
    };

    initializeStorage();
  }, []);

  if (!loaded || !storageInitialized) {
    return (
      <SafeAreaView 
        style={{ 
          flex: 1, 
          backgroundColor: colorScheme === 'dark' ? DarkTheme.colors.background : DefaultTheme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ alignItems: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#000'} />
          <Text style={{ 
            color: colorScheme === 'dark' ? '#fff' : '#000',
            fontSize: 16,
            fontWeight: '500',
          }}>
            {!loaded ? 'Loading fonts...' : 'Initializing database...'}
          </Text>
          {initializationError && (
            <Text style={{ 
              color: '#ff6b6b',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
            }}>
              Warning: {initializationError}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: colorScheme === 'dark' ? DarkTheme.colors.background : DefaultTheme.colors.background 
      }} 
      edges={['left', 'right']}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="book/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaView>
  );
}
