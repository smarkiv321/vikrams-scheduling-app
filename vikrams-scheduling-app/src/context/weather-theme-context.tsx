import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { fetchWeatherForLocation, WeatherCondition } from '@/services/weather';

const ENABLED_STORAGE_KEY = 'schedule.weatherThemeEnabled';
const LOCATION_MODE_STORAGE_KEY = 'schedule.weatherLocationMode';
const CUSTOM_QUERY_STORAGE_KEY = 'schedule.weatherCustomQuery';
const CUSTOM_COORDS_STORAGE_KEY = 'schedule.weatherCustomCoords';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

type LocationMode = 'current' | 'custom';
type Coords = { latitude: number; longitude: number };

export type LocationCandidate = Coords & { label: string };

type WeatherThemeContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  condition: WeatherCondition | null;
  isDay: boolean;
  isLoading: boolean;
  error: string | null;
  locationMode: LocationMode;
  customLocationLabel: string | null;
  searchLocations: (query: string) => Promise<LocationCandidate[]>;
  selectCustomLocation: (candidate: LocationCandidate) => void;
  useCurrentLocation: () => void;
};

const WeatherThemeContext = createContext<WeatherThemeContextValue | null>(null);

export function WeatherThemeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [condition, setCondition] = useState<WeatherCondition | null>(null);
  const [isDay, setIsDay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('current');
  const [customLocationLabel, setCustomLocationLabel] = useState<string | null>(null);
  const [customCoords, setCustomCoords] = useState<Coords | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ENABLED_STORAGE_KEY).then((value) => {
      if (value === 'true') setEnabledState(true);
    });
    AsyncStorage.getItem(LOCATION_MODE_STORAGE_KEY).then((value) => {
      if (value === 'custom') setLocationMode('custom');
    });
    AsyncStorage.getItem(CUSTOM_QUERY_STORAGE_KEY).then((value) => {
      if (value) setCustomLocationLabel(value);
    });
    AsyncStorage.getItem(CUSTOM_COORDS_STORAGE_KEY).then((value) => {
      if (value) {
        try {
          setCustomCoords(JSON.parse(value));
        } catch {
          // ignore malformed cached coords
        }
      }
    });
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    AsyncStorage.setItem(ENABLED_STORAGE_KEY, value ? 'true' : 'false');
    if (!value) {
      setCondition(null);
      setError(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let coords: Coords;
      if (locationMode === 'custom' && customCoords) {
        coords = customCoords;
      } else {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          setError('Location permission denied');
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        coords = position.coords;
      }
      const snapshot = await fetchWeatherForLocation(coords.latitude, coords.longitude);
      setCondition(snapshot.condition);
      setIsDay(snapshot.isDay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  }, [locationMode, customCoords]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, refresh]);

  const searchLocations = useCallback(async (query: string): Promise<LocationCandidate[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const geocoded = await Location.geocodeAsync(trimmed);
    const candidates = await Promise.all(
      geocoded.slice(0, 8).map(async (loc): Promise<LocationCandidate> => {
        const fallbackLabel = `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`;
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
          const parts = [
            address?.city ?? address?.district ?? address?.subregion,
            address?.region,
            address?.country,
          ].filter((part): part is string => Boolean(part));
          return {
            latitude: loc.latitude,
            longitude: loc.longitude,
            label: parts.length > 0 ? parts.join(', ') : fallbackLabel,
          };
        } catch {
          return { latitude: loc.latitude, longitude: loc.longitude, label: fallbackLabel };
        }
      })
    );

    const seenLabels = new Set<string>();
    return candidates.filter((candidate) => {
      if (seenLabels.has(candidate.label)) return false;
      seenLabels.add(candidate.label);
      return true;
    });
  }, []);

  const selectCustomLocation = useCallback((candidate: LocationCandidate) => {
    const coords = { latitude: candidate.latitude, longitude: candidate.longitude };
    setCustomCoords(coords);
    setCustomLocationLabel(candidate.label);
    setLocationMode('custom');
    AsyncStorage.multiSet([
      [LOCATION_MODE_STORAGE_KEY, 'custom'],
      [CUSTOM_QUERY_STORAGE_KEY, candidate.label],
      [CUSTOM_COORDS_STORAGE_KEY, JSON.stringify(coords)],
    ]);
  }, []);

  const useCurrentLocation = useCallback(() => {
    setLocationMode('current');
    AsyncStorage.setItem(LOCATION_MODE_STORAGE_KEY, 'current');
  }, []);

  const value = useMemo<WeatherThemeContextValue>(
    () => ({
      enabled,
      setEnabled,
      condition,
      isDay,
      isLoading,
      error,
      locationMode,
      customLocationLabel,
      searchLocations,
      selectCustomLocation,
      useCurrentLocation,
    }),
    [
      enabled,
      setEnabled,
      condition,
      isDay,
      isLoading,
      error,
      locationMode,
      customLocationLabel,
      searchLocations,
      selectCustomLocation,
      useCurrentLocation,
    ]
  );

  return <WeatherThemeContext.Provider value={value}>{children}</WeatherThemeContext.Provider>;
}

export function useWeatherTheme(): WeatherThemeContextValue {
  const context = useContext(WeatherThemeContext);
  if (!context) {
    throw new Error('useWeatherTheme must be used within a WeatherThemeProvider');
  }
  return context;
}
