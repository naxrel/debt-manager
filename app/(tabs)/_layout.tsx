import { HapticTab } from '@/components/haptic-tab';
import { TabIcon } from '@/components/tab-icon';
import { useAuth } from '@/contexts/AuthContext';
import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Font } from '@/constants/theme';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- 1. DESIGN TOKENS (REVISED) ---
const COLORS = {
  primary: '#6366F1', // Indigo 500
  inactive: '#94A3B8', // Slate 400
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassSurface: 'rgba(255, 255, 255, 0.9)', // Lebih solid agar tidak terlihat kotor di Android
  shadow: '#4F46E5',
};

const METRICS = {
  height: 65, // REVISI: Dikurangi dari 80 ke 65 agar lebih ramping
  radius: 20, // REVISI: Radius sedikit dikurangi agar tidak terlalu bulat lonjong
  margin: 16, // REVISI: Margin dikurangi agar bar lebih lebar (safe area)
  iconSize: 22, // REVISI: Ukuran icon disesuaikan dengan adanya teks
};

// --- 2. SUB-COMPONENTS ---
const GlassTabBarBackground = () => (
  <View style={styles.blurContainer}>
    <BlurView
      intensity={Platform.OS === 'ios' ? 100 : 60}
      tint="light"
      style={StyleSheet.absoluteFill}
    />

    {Platform.OS === 'android' && (
      <View style={styles.androidFallback} />
    )}

    <View style={styles.glassBorder} />
  </View>
);


// --- 3. MAIN COMPONENT ---
export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!user) return <Redirect href="/auth/login" />;

  // Logic Bottom: Di Android, jangan terlalu tinggi melayangnya
  const floatingBottom = Platform.select({
    ios: insets.bottom > 0 ? insets.bottom : 20,
    android: 16, 
    default: 20
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarButton: HapticTab,
        
        // --- PERUBAHAN UTAMA: LABEL DIAKTIFKAN ---
        tabBarShowLabel: true, 
        
        // Styling Teks Label
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Font.bold,
          letterSpacing: 0.1,
          marginBottom: 6, // Memberi jarak dari bawah container
          marginTop: -4,   // Menarik teks sedikit mendekati icon
        },

        // Background
        tabBarBackground: GlassTabBarBackground,

        // Styling Container Tab
        tabBarStyle: [
          styles.tabBarBase,
          { 
            bottom: floatingBottom,
            marginHorizontal: METRICS.margin,
          }
        ],
      }}>
      
      {/* URUTAN: Home -> Groups -> Settings */}
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home', // Label otomatis muncul dari sini
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={color} size={METRICS.iconSize} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="group"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => (
            <TabIcon name="people" color={color} size={METRICS.iconSize} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <TabIcon name="settings" color={color} size={METRICS.iconSize} />
          ),
        }}
      />
    </Tabs>
  );
}

// --- 4. STYLESHEET ---
const styles = StyleSheet.create({
  tabBarBase: {
    position: 'absolute',
    height: METRICS.height,
    borderRadius: METRICS.radius,
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    
    // Shadow disesuaikan agar tidak terlalu tebal
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    
    // Layout Item (Penting untuk Label + Icon)
    paddingTop: 8, // Memberi ruang atas untuk icon
    paddingBottom: 8, // Memberi ruang bawah (akan dikontrol labelStyle juga)
  },

  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: METRICS.radius,
    overflow: 'hidden',
  },

  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: METRICS.radius,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },

androidFallback: {
  backgroundColor: 'rgba(255,255,255,0.75)',
}
});