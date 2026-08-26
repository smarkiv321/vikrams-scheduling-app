import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ScheduleProvider } from '@/context/schedule-context';
import { WeatherThemeProvider } from '@/context/weather-theme-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WeatherThemeProvider>
        <ScheduleProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="event/[id]" options={{ gestureEnabled: true }} />
          </Stack>
        </ScheduleProvider>
      </WeatherThemeProvider>
    </ThemeProvider>
  );
}
