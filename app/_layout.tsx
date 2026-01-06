import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Pastikan path import ini sesuai dengan lokasi file Anda
import { AuthProvider } from '@/contexts/AuthContext';
import { DebtProvider } from '@/contexts/DebtContext';
import { AppThemeProvider } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

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
            {/* 1. WRAP APLIKASI DENGAN TOAST PROVIDER DI SINI */}
              <Stack
                screenOptions={{
                  headerShown: false,
                  // 2. ANIMASI DEFAULT UNTUK SEMUA PAGE (Native Slide)
                  animation: 'slide_from_right', 
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/register" />
                
                {/* Debt Screens */}
                <Stack.Screen name="debt/add" />
                <Stack.Screen name="debt/detail" />
                <Stack.Screen name="debt/pending" />
                
                {/* Group Screens */}
                <Stack.Screen name="group/[id]" />
                <Stack.Screen name="group/create" />
                <Stack.Screen name="group/[id]/add-transaction" />
                
                {/* 3. GROUP INFO SEBAGAI MODAL (Slide from Bottom) */}
                <Stack.Screen 
                  name="group/[id]/info" 
                  options={{ 
                    presentation: 'modal', 
                    animation: 'slide_from_bottom' 
                  }} 
                />

                {/* Other Screens */}
                <Stack.Screen name="history" />
                <Stack.Screen name="about" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="security" />
                <Stack.Screen name="account-savings" />
                
                {/* Modal Global */}
                <Stack.Screen 
                  name="modal" 
                  options={{ 
                    presentation: 'modal', 
                    title: 'Modal' 
                  }} 
                />
              </Stack>
              <StatusBar style="auto" />
          </ThemeProvider>
        </DebtProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}