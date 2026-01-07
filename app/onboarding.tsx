import { Font } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// --- MODERN PALETTE & CONFIG ---
const COLORS = {
  white: '#FFFFFF',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassBg: 'rgba(255, 255, 255, 0.1)',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
};

// Gradient yang lebih 'Rich' dan Deep untuk kontras teks yang lebih baik
const PAGE_COLORS = [
  ['#4338CA', '#6366F1'], // Deep Indigo -> Soft Indigo
  ['#047857', '#10B981'], // Deep Emerald -> Bright Emerald
  ['#BE185D', '#EC4899'], // Deep Rose -> Hot Pink
];

interface OnboardingPage {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PAGES: OnboardingPage[] = [
  {
    title: 'Financial Hub',
    description: 'Satukan cash, crypto, dan aset globalmu dalam satu genggaman. Kontrol penuh tanpa batas.',
    icon: 'wallet-outline',
  },
  {
    title: 'Circle & Split',
    description: 'Transparansi total dalam grup. Pantau siapa yang belum bayar tanpa perlu rasa tidak enak.',
    icon: 'people-outline',
  },
  {
    title: 'Smart Payment',
    description: 'Algoritma cerdas yang memilih metode bayar paling efisien untuk menghemat waktu Anda.',
    icon: 'rocket-outline', // Mengganti icon agar lebih 'impactful'
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // --- LOGIC PRESERVED 100% ---
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / width);
        setCurrentPage(page);
      },
    }
  );

  const completeOnboarding = async (path: '/auth/register' | '/auth/login') => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.push(path);
  };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentPage + 1),
        animated: true,
      });
    } else {
      completeOnboarding('/auth/register');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* BACKGROUND LAYER */}
      {PAGES.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={`bg-${index}`}
            style={[StyleSheet.absoluteFill, { opacity }]}
          >
            <LinearGradient
              colors={PAGE_COLORS[index]}
              style={{ flex: 1 }}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            {/* Noise Texture Overlay (Optional Simulated by subtle gradient) */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        );
      })}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {PAGES.map((page, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          // Parallax Text Effect
          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [width * 0.2, 0, -width * 0.2],
          });

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            <View key={index} style={[styles.page, { width }]}>
              <View style={styles.contentWrapper}>
                
                {/* MODERN GLASS ICON CONTAINER */}
                <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
                  <View style={styles.iconGlassBackground} />
                  <Ionicons name={page.icon} size={64} color={COLORS.white} style={styles.iconShadow} />
                </Animated.View>

                {/* TYPOGRAPHY */}
                <Animated.View style={{ transform: [{ translateX }], opacity }}>
                  <Text style={styles.title}>{page.title}</Text>
                  <Text style={styles.description}>{page.description}</Text>
                </Animated.View>
                
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* BOTTOM ACTION AREA */}
      <View style={styles.footerContainer}>
        
        {/* PAGINATION DOTS */}
        <View style={styles.paginationContainer}>
          {PAGES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 32, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity },
                ]}
              />
            );
          })}
        </View>

        {/* MODERN BUTTONS */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {currentPage === PAGES.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            {currentPage !== PAGES.length - 1 && (
               <Ionicons name="arrow-forward" size={18} color="#1F2937" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => completeOnboarding('/auth/login')}
            activeOpacity={0.7}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Slate 900 fallback
  },
  page: {
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 160, // Push content slightly up
  },
  
  // GLASS ICON STYLES
  iconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  iconGlassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glassBg,
    borderRadius: 40, // Squircle shape
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    transform: [{ rotate: '45deg' }], // Diamond aesthetic
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  iconShadow: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },

  // TYPOGRAPHY STYLES
  title: {
    fontSize: 36, // Larger display text
    fontFamily: Font.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1, // Tight tracking for modern feel
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26, // Generous line height for readability
    paddingHorizontal: 10,
  },

  // FOOTER STYLES
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 32,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 10,
    marginBottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  buttonWrapper: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    height: 60,
    borderRadius: 100, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#111827', // Dark Slate for contrast
    letterSpacing: 0.5,
  },
  secondaryButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: Font.semiBold,
    color: COLORS.white,
    opacity: 0.9,
  },
});