import { Font } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// Modern Color Palette (Dribbble Style)
const COLORS = {
  success: {
    bgLight: 'rgba(236, 253, 245, 0.95)', // Very light emerald with opacity
    border: 'rgba(167, 243, 208, 0.6)', // Soft emerald border
    title: '#065F46', // Dark emerald for title
    subtitle: '#047857', // Emerald for content
    accent: '#34D399', // Emerald accent
  },
  error: {
    bgLight: 'rgba(255, 241, 242, 0.95)', // Very light rose with opacity
    border: 'rgba(253, 164, 175, 0.6)', // Soft rose border
    title: '#9F1239', // Dark rose for title
    subtitle: '#BE123C', // Rose for content
    accent: '#FB7185', // Rose accent
  },
  shadow: {
    color: '#171717', // Neutral-900
    opacity: 0.06,
  },
};

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onHide: () => void;
}

export const CustomToast: React.FC<ToastProps> = ({ 
  visible, 
  message, 
  type, 
  duration = 3000,
  onHide 
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current; // Start slightly smaller

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30) { // Easier dismiss threshold
          hideToast();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80, // Snappier spring
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      showToast();
      const timer = setTimeout(() => {
        hideToast();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const showToast = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const colorScheme = COLORS[type];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          backgroundColor: colorScheme.bgLight,
          borderColor: colorScheme.border,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {/* Swipe Indicator - Minimalist Pill */}
      <View style={styles.indicatorContainer}>
        <View style={[styles.swipeIndicator, { backgroundColor: colorScheme.accent }]} />
      </View>

      <TouchableOpacity 
        style={styles.content} 
        onPress={hideToast}
        activeOpacity={0.8}
      >
        <View style={styles.textWrapper}>
          <Text style={[styles.title, { color: colorScheme.title }]}>
            {type === 'success' ? 'Success' : 'Error'}
          </Text>
          <Text style={[styles.message, { color: colorScheme.subtitle }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40, // More breathing room from top
    alignSelf: 'center',
    width: 'auto', // Pill shape adapts to content
    maxWidth: width - 48, // Prevent edge-to-edge
    minWidth: 140, // Minimum width for short messages
    borderRadius: 35, // Fully rounded pill shape
    borderWidth: 1,
    paddingBottom: 1, // Fine-tuning padding
    
    // Modern Soft Shadow
    shadowColor: COLORS.shadow.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: COLORS.shadow.opacity,
    shadowRadius: 16,
    elevation: 4,
    
    zIndex: 9999,
    overflow: 'hidden', // Clip content to rounded corners
  },
  indicatorContainer: {
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 1,
  },
  swipeIndicator: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 7,
    paddingTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: Font.bold || 'System', // Fallback font
    marginBottom: 1.5, // Spacing between title and message
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  message: {
    fontSize: 12,
    fontFamily: Font.regular || 'System', // Fallback font
    textAlign: 'center',
    lineHeight: 15, // Better readability
    opacity: 0.9,
  },
});