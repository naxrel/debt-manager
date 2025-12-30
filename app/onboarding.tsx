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

// --- MODERN COLORS ---
// Menggunakan palet warna yang lebih vibrant dan modern
const PAGE_COLORS = [
  ['#4F46E5', '#818CF8'], // Indigo (Modern Blue)
  ['#059669', '#34D399'], // Emerald (Modern Green)
  ['#D946EF', '#F472B6'], // Fuchsia (Modern Pink)
];

interface OnboardingPage {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PAGES: OnboardingPage[] = [
  {
    title: 'Welcome to deBT',
    description: 'Bawa semua urusan uangmu jadi satu. Dari cash, crypto, sampai transfer antar negara, semua beres di sini.',
    icon: 'wallet-outline', // Icon yang lebih relevan
  },
  {
    title: 'Grup & Kolaborasi',
    description: 'Nggak usah pusing nagih utang temen. Bikin grup, catet bareng, dan liat siapa yang belum bayar dengan transparan.',
    icon: 'people-outline',
  },
  {
    title: 'Bayar Lebih Pinter',
    description: 'Biar sistem yang mikir cara bayar paling efisien. Hemat waktu, hemat tenaga, utang lunas lebih cepet.',
    icon: 'trending-up-outline',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false, // width interploation doesn't support native driver
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

      {/* BACKGROUND GRADIENT ANIMATION */}
      {/* Kita tumpuk gradien absolute di belakang agar transisi warna smooth saat scroll */}
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
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [100, 0, 100],
            extrapolate: 'clamp',
          });

          const textOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            <View key={index} style={[styles.page, { width }]}>
              {/* CONTENT CONTAINER */}
              <View style={styles.contentContainer}>
                
                {/* ANIMATED ICON */}
                <Animated.View
                  style={[
                    styles.iconCircle,
                    {
                      transform: [{ scale }, { translateY }],
                    },
                  ]}
                >
                  <Ionicons name={page.icon} size={80} color="#fff" />
                  
                  {/* Decorative Rings */}
                  <View style={[styles.ring, { width: 160, height: 160, opacity: 0.3 }]} />
                  <View style={[styles.ring, { width: 200, height: 200, opacity: 0.15 }]} />
                </Animated.View>

                {/* TEXT CONTENT */}
                <Animated.View style={{ opacity: textOpacity, alignItems: 'center', paddingHorizontal: 32 }}>
                  <Text style={styles.title}>{page.title}</Text>
                  <Text style={styles.description}>{page.description}</Text>
                </Animated.View>

              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* FOOTER CONTROLS */}
      <View style={styles.footer}>
        
        {/* PAGE INDICATORS */}
        <View style={styles.indicatorContainer}>
          {PAGES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[styles.indicator, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {currentPage === PAGES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {currentPage !== PAGES.length - 1 && (
               <Ionicons name="arrow-forward" size={20} color={PAGE_COLORS[currentPage][0]} style={{marginLeft: 8}} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => completeOnboarding('/auth/login')}
            activeOpacity={0.7}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fallback color
  },
  page: {
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Memberi ruang untuk footer
  },
  
  // ICON STYLES
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    // Glassmorphism effect simulation
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fff',
  },

  // TEXT STYLES
  title: {
    fontSize: 32,
    fontFamily: Font.bold,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5, // Modern tight tracking
  },
  description: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24, // Legible line height
    maxWidth: '90%',
  },

  // FOOTER STYLES
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    // Gradient overlay for readability (optional)
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 20, // Rounded corners
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#1a1a2e', // Dark text on white button
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: 'rgba(255,255,255,0.7)',
  },
});