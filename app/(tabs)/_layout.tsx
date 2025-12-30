import { HapticTab } from '@/components/haptic-tab';
import { TabIcon } from '@/components/tab-icon';
import { useAuth } from '@/contexts/AuthContext';
import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#4F46E5',
  inactive: '#94A3B8',
  shadow: '#4F46E5',
};

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets(); // Deteksi area aman HP

  if (isLoading) return null;
  if (!user) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        
        // --- 1. Background Glass Effect ---
        tabBarBackground: () => (
          <View style={styles.blurWrapper}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 80 : 100}
              tint="light" // 'light' lebih bersih daripada 'extraLight'
              style={StyleSheet.absoluteFill}
            />
            {/* Border halus untuk definisi lebih tajam */}
            <View style={styles.glassBorder} />
          </View>
        ),
        
        // --- 2. Floating Style Adjusted ---
        tabBarStyle: {
          position: 'absolute',
          // Logic: Jika ada safe area bawah (iPhone X+), naikkan 0px dari safe area.
          // Jika tidak (Android/iPhone lama), naikkan 20px dari bawah layar.
          bottom: insets.bottom > 0 ? 0 : 20, 
          left: 20,
          right: 20,
          height: 70, // Tinggi fixed agar icon centered sempurna
          backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.9)' : 'transparent',
          borderRadius: 35, // Pill Shape
          borderTopWidth: 0,
          elevation: 0, // Matikan shadow bawaan Android
          
          // Padding agar icon ada di tengah vertikal tab bar
          paddingTop: 0, 
          paddingBottom: 0, // Reset padding insets default
          
          // Custom Shadow
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
      }}>
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} size={24} />,
        }}
      />
      
      <Tabs.Screen
        name="group"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => <TabIcon name="people" color={color} size={24} />,
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  blurWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    overflow: 'hidden',
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});