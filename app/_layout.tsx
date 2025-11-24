import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { DebtProvider } from '@/contexts/DebtContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <DebtProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="debt/add" options={{ presentation: 'modal', title: 'Tambah Utang Piutang' }} />
            <Stack.Screen name="debt/detail" options={{ presentation: 'modal', title: 'Detail' }} />
            <Stack.Screen name="debt/pending" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="group/create" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/add-transaction" options={{ headerShown: false }} />
            <Stack.Screen name="all" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </DebtProvider>
    </AuthProvider>
  );
}
