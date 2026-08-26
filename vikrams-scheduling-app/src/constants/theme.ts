/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2B1B12',
    background: '#FBF3EA',
    backgroundElement: '#F4E4D3',
    backgroundSelected: '#EAD2B4',
    textSecondary: '#8C7361',
    tint: '#E0703F',
  },
  dark: {
    text: '#F7ECDF',
    background: '#1C1310',
    backgroundElement: '#2E2019',
    backgroundSelected: '#3D2B21',
    textSecondary: '#BFA48D',
    tint: '#F0865A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const WeatherPalettes = {
  clear: {
    day: {
      text: '#1B3A4B',
      background: '#D6EAF8',
      backgroundElement: '#BFE0F5',
      backgroundSelected: '#A6D2EE',
      textSecondary: '#5C7A8A',
      tint: '#F5A623',
    },
    night: {
      text: '#E8EEF5',
      background: '#0B1420',
      backgroundElement: '#16222F',
      backgroundSelected: '#20303F',
      textSecondary: '#8CA0B3',
      tint: '#F0C572',
    },
  },
  cloudy: {
    day: {
      text: '#2B2B28',
      background: '#E4E4E0',
      backgroundElement: '#D3D3CE',
      backgroundSelected: '#C2C2BB',
      textSecondary: '#7A7A73',
      tint: '#6B7B8C',
    },
    night: {
      text: '#EAEAE6',
      background: '#17181A',
      backgroundElement: '#232427',
      backgroundSelected: '#2E3033',
      textSecondary: '#9A9A96',
      tint: '#8C97A6',
    },
  },
  fog: {
    day: {
      text: '#3A3A36',
      background: '#ECEAE4',
      backgroundElement: '#DAD7CF',
      backgroundSelected: '#C9C5BA',
      textSecondary: '#8A857A',
      tint: '#9B9186',
    },
    night: {
      text: '#E5E3DE',
      background: '#1A1917',
      backgroundElement: '#252420',
      backgroundSelected: '#302E29',
      textSecondary: '#9C978D',
      tint: '#B5AB9E',
    },
  },
  rain: {
    day: {
      text: '#1F2E33',
      background: '#C9D6DC',
      backgroundElement: '#B3C4CC',
      backgroundSelected: '#9DB3BC',
      textSecondary: '#56666C',
      tint: '#3C6E86',
    },
    night: {
      text: '#DCE6EA',
      background: '#0C1518',
      backgroundElement: '#16232A',
      backgroundSelected: '#1F313A',
      textSecondary: '#7C939C',
      tint: '#5A94AD',
    },
  },
  snow: {
    day: {
      text: '#26343A',
      background: '#F0F6F8',
      backgroundElement: '#DCEAEE',
      backgroundSelected: '#C8DFE5',
      textSecondary: '#6E8890',
      tint: '#5C93A3',
    },
    night: {
      text: '#E6EEF1',
      background: '#0D171B',
      backgroundElement: '#182529',
      backgroundSelected: '#233338',
      textSecondary: '#83A0A9',
      tint: '#7EB2C2',
    },
  },
  storm: {
    day: {
      text: '#F0EDF2',
      background: '#4A4552',
      backgroundElement: '#3A3540',
      backgroundSelected: '#2C2833',
      textSecondary: '#B8B0C2',
      tint: '#B98CC7',
    },
    night: {
      text: '#EFE9F2',
      background: '#100D14',
      backgroundElement: '#1C1722',
      backgroundSelected: '#28212F',
      textSecondary: '#A899B3',
      tint: '#9B7EA8',
    },
  },
} as const;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
