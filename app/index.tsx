import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      console.log('hasSeenOnboarding value:', seen);
      setHasSeenOnboarding(seen === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasSeenOnboarding(false);
    }
  };

  if (isLoading || hasSeenOnboarding === null) {
    return null;
  }

  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Show onboarding for first time users
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Returning users go straight to login
  return <Redirect href="/auth/login" />;
}
