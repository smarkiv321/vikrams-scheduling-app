/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, ThemeColor, WeatherPalettes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeatherTheme } from '@/context/weather-theme-context';

export type Theme = Record<ThemeColor, string>;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;
  const { enabled, condition, isDay } = useWeatherTheme();

  if (enabled && condition) {
    return WeatherPalettes[condition][isDay ? 'day' : 'night'];
  }
  return Colors[theme];
}
