import { Font } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <Animated.View 
        style={styles.header}
        entering={FadeInDown.duration(400).springify()}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo Section */}
        <Animated.View 
          style={styles.logoSection}
          entering={FadeInUp.delay(100).duration(600).springify()}
        >
          <Image source={require('../assets/images/debT.png')} style={styles.logo} />

        </Animated.View>

        {/* Mission Section */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(200).duration(600).springify()}
        >
          <Text style={styles.missionText}>
            Mempermudah pengelolaan perhutangan dengan temanmu atau circle mu dengan mudah. Nggak perlu
            nagih sana sini lagi!
          </Text>
        </Animated.View>

        {/* Contact Section */}
        <Animated.View 
          style={[styles.section, styles.lastSection]}
          entering={FadeInUp.delay(600).duration(600).springify()}
        >
          <Text style={styles.sectionTitle}>Hubungi Kami</Text>
          <View style={styles.card}>
            <ContactItem text="support@debt.app" index={0} />
            <View style={styles.divider} />
            <ContactItem text="www.debt.app" index={1} />
            <View style={styles.divider} />
            <ContactItem text="@debt.official" index={2} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ContactItem({ text, index }: { text: string; index: number }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.contactItem, animatedStyle]}>
        <Text style={styles.contactText}>{text}</Text>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 50,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 23,
    color: '#000',
    fontFamily: Font.bold,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logo: {
    width: 350,
    height: 200,
    resizeMode: 'contain',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  lastSection: {
    marginBottom: 0,
  },
  missionText: {
    fontSize: 15,
    color: '#666',
    fontFamily: Font.regular,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#000',
    fontFamily: Font.bold,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    paddingVertical: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    fontFamily: Font.bold,
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 13,
    color: '#999',
    fontFamily: Font.regular,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 24,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Font.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontFamily: Font.regular,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  teamItem: {
    paddingVertical: 12,
  },
  teamName: {
    fontSize: 14,
    color: '#000',
    fontFamily: Font.bold,
    marginBottom: 3,
  },
  teamRole: {
    fontSize: 13,
    color: '#999',
    fontFamily: Font.regular,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    fontFamily: Font.regular,
  },
});