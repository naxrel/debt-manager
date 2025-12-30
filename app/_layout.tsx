import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { DebtProvider } from '@/contexts/DebtContext';
import { AppThemeProvider } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
  'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
  'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
});

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <DebtProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="debt/add" options={{ headerShown: false }} />
            <Stack.Screen name="debt/detail" options={{ headerShown: false }} />
            <Stack.Screen name="debt/pending" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="group/create" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/add-transaction" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="security" options={{ headerShown: false }} />
            <Stack.Screen name="account-savings" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/info" options={{ headerShown: false }} />
          </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </DebtProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
