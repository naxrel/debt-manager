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

interface OnboardingPage {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: string[];
}

const PAGES: OnboardingPage[] = [
  {
    title: 'Welcome to deBT',
    description: 'deBT brings your money together — from cash to crypto to cross-border transfers.',
    icon: 'flash',
    colors: ['#1a1a2e', '#16213e', '#0f3460'],
  },
  {
    title: 'Grup & Kolaborasi',
    description: 'Kelola utang piutang dalam grup dengan mudah. Lacak siapa yang berhutang kepada siapa.',
    icon: 'people',
    colors: ['#667eea', '#764ba2'],
  },
  {
    title: 'Optimasi Pembayaran',
    description: 'Hitung pembayaran optimal secara otomatis. Hemat waktu dan tenaga dalam menyelesaikan utang.',
    icon: 'calculator',
    colors: ['#f093fb', '#f5576c'],
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
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / width);
        setCurrentPage(page);
      },
    }
  );

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/auth/register');
  };

  const handleSignIn = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/auth/login');
  };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentPage + 1),
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {PAGES.map((page, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [50, 0, 50],
            extrapolate: 'clamp',
          });

          return (
            <View key={index} style={[styles.page, { width }]}>
              <LinearGradient
                colors={page.colors}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon Section with Parallax */}
                <View style={styles.iconSection}>
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        transform: [{ scale }, { translateY }],
                        opacity,
                      },
                    ]}
                  >
                    <View style={styles.iconWrapper}>
                      <Ionicons name={page.icon} size={80} color="#fff" />
                    </View>

                    {/* Orbiting Elements (only for first page) */}
                    {index === 0 && (
                      <>
                        <Animated.View
                          style={[
                            styles.orbitingIcon,
                            styles.orbitTop,
                            { opacity },
                          ]}
                        >
                          <Ionicons name="trending-up" size={24} color="#4ade80" />
                        </Animated.View>
                        <Animated.View
                          style={[
                            styles.orbitingIcon,
                            styles.orbitRight,
                            { opacity },
                          ]}
                        >
                          <Ionicons name="sunny" size={24} color="#fbbf24" />
                        </Animated.View>
                        <Animated.View
                          style={[
                            styles.orbitingIcon,
                            styles.orbitBottom,
                            { opacity },
                          ]}
                        >
                          <Ionicons name="earth" size={24} color="#60a5fa" />
                        </Animated.View>
                        <Animated.View
                          style={[
                            styles.orbitingIcon,
                            styles.orbitLeft,
                            { opacity },
                          ]}
                        >
                          <Ionicons name="moon" size={24} color="#94a3b8" />
                        </Animated.View>
                      </>
                    )}

                    {/* Card visual for last page */}
                    {index === 2 && (
                      <Animated.View
                        style={[
                          styles.cardVisual,
                          { opacity },
                        ]}
                      >
                        <View style={styles.card}>
                          <Text style={styles.cardTitle}>PAY BILLS</Text>
                          <View style={styles.cardIcons}>
                            <View style={styles.cardIcon}>
                              <Ionicons name="logo-bitcoin" size={20} color="#fff" />
                            </View>
                            <View style={[styles.cardIcon, styles.cardIconSecond]}>
                              <Ionicons name="cash" size={20} color="#fff" />
                            </View>
                          </View>
                          <Text style={styles.cardSubtitle}>Crypto    Cash</Text>
                        </View>
                      </Animated.View>
                    )}
                  </Animated.View>
                </View>

                {/* Text Content */}
                <Animated.View
                  style={[
                    styles.textSection,
                    { opacity },
                  ]}
                >
                  <Text style={styles.title}>{page.title}</Text>
                  <Text style={styles.description}>{page.description}</Text>
                </Animated.View>

                {/* Decorative Stars */}
                {index === 0 && (
                  <View style={styles.starsContainer}>
                    {[...Array(20)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.star,
                          {
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.5 + 0.2,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>

      {/* Page Indicators */}
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
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {currentPage === PAGES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSignIn}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    height,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  iconSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  iconContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  orbitingIcon: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  orbitTop: {
    top: -20,
    left: 76,
  },
  orbitRight: {
    top: 76,
    right: -20,
  },
  orbitBottom: {
    bottom: -20,
    left: 76,
  },
  orbitLeft: {
    top: 76,
    left: -20,
  },
  cardVisual: {
    position: 'absolute',
    top: 180,
    width: 200,
  },
  card: {
    backgroundColor: '#60a5fa',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 12,
    color: '#fff',
    fontFamily: Font.bold,
    marginBottom: 16,
  },
  cardIcons: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconSecond: {
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#fff',
    fontFamily: Font.regular,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  textSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: Font.bold,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Font.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  ctaContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a2e',
    fontFamily: Font.bold,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: Font.semiBold,
  },
});
