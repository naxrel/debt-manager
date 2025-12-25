/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Custom color palette: Dark blue theme
const primary = '#344170';      // Dark blue - primary actions
const secondary = '#54638d';    // Medium blue - secondary elements
const darkBg = '#272f55';       // Darkest blue - backgrounds
const lightBg = '#f8f9fc';      // Light background for light mode

const tintColorLight = primary;
const tintColorDark = secondary;

export const Colors = {
  light: {
    text: '#1a1f3a',
    background: lightBg,
    tint: tintColorLight,
    icon: '#54638d',
    tabIconDefault: '#54638d',
    tabIconSelected: primary,
    primary: primary,
    secondary: secondary,
    dark: darkBg,
    card: '#ffffff',
    border: '#e2e5ed',
    accent: '#5a6fa8',
  },
  dark: {
    text: '#e8eaf0',
    background: darkBg,
    tint: tintColorDark,
    icon: '#9aa5c7',
    tabIconDefault: '#9aa5c7',
    tabIconSelected: '#ffffff',
    primary: secondary,
    secondary: primary,
    dark: '#1a2038',
    card: '#344170',
    border: 'rgba(61, 74, 115, 1)',
    accent: '#7589c1',
  },
};

// Biennale Custom Fonts
export const Font = {
  regular: 'Inter-Regular',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});


