import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSchedule } from '@/context/schedule-context';
import { LocationCandidate, useWeatherTheme } from '@/context/weather-theme-context';
import { useTheme } from '@/hooks/use-theme';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getWeatherStatus(
  enabled: boolean,
  isLoading: boolean,
  error: string | null,
  condition: string | null,
  isDay: boolean
) {
  if (!enabled) return 'Off';
  if (isLoading && !condition) return 'Detecting current weather…';
  if (error) return error;
  if (condition) {
    const label = condition.charAt(0).toUpperCase() + condition.slice(1);
    return `${label} · ${isDay ? 'Day' : 'Night'}`;
  }
  return 'Waiting for location…';
}

export default function HomeScreen() {
  const theme = useTheme();
  const {
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
  } = useWeatherTheme();
  const [locationInput, setLocationInput] = useState(customLocationLabel ?? '');
  const [searchResults, setSearchResults] = useState<LocationCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { accessToken, availableCalendars, hiddenCalendarIds, toggleCalendarHidden } =
    useSchedule();

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchLocations(locationInput);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(`Couldn't find "${locationInput}"`);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (candidate: LocationCandidate) => {
    selectCustomLocation(candidate);
    setLocationInput(candidate.label);
    setSearchResults([]);
    setSearchError(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          {getGreeting()}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardTextGroup}>
              <ThemedText type="smallBold">Weather Theme</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {getWeatherStatus(enabled, isLoading, error, condition, isDay)}
              </ThemedText>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: theme.tint }} />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            When on, the app&apos;s colors shift to match the current sky at your chosen location.
          </ThemedText>

          {enabled && (
            <View style={styles.locationSection}>
              <ThemedText type="smallBold">Location</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {locationMode === 'custom' && customLocationLabel
                  ? `Using: ${customLocationLabel}`
                  : 'Using your current location'}
              </ThemedText>
              <View style={styles.locationInputRow}>
                <TextInput
                  value={locationInput}
                  onChangeText={(text) => {
                    setLocationInput(text);
                    setSearchResults([]);
                    setSearchError(null);
                  }}
                  onSubmitEditing={handleSearch}
                  placeholder="City or place name"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.locationInput,
                    { color: theme.text, backgroundColor: theme.background },
                  ]}
                />
                <Pressable
                  onPress={handleSearch}
                  style={({ pressed }) => [
                    styles.locationButton,
                    { backgroundColor: theme.tint },
                    pressed && styles.pressed,
                  ]}>
                  {isSearching ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <ThemedText style={styles.locationButtonText}>Search</ThemedText>
                  )}
                </Pressable>
              </View>

              {searchError && (
                <ThemedText type="small" themeColor="textSecondary">
                  {searchError}
                </ThemedText>
              )}

              {searchResults.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: theme.background }]}>
                  {searchResults.map((candidate, index) => (
                    <Pressable
                      key={`${candidate.latitude},${candidate.longitude}`}
                      onPress={() => handleSelect(candidate)}
                      style={({ pressed }) => [
                        styles.dropdownRow,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.backgroundSelected },
                        pressed && { backgroundColor: theme.backgroundSelected },
                      ]}>
                      <ThemedText type="small">{candidate.label}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              {locationMode === 'custom' && (
                <Pressable onPress={useCurrentLocation} hitSlop={8}>
                  <ThemedText type="small" style={{ color: theme.tint }}>
                    Use current location instead
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}
        </ThemedView>

        {accessToken && availableCalendars.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Calendars</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Choose which of your Google calendars show up in this app.
            </ThemedText>
            <View style={styles.calendarList}>
              {availableCalendars.map((calendar) => (
                <View key={calendar.id} style={styles.calendarRow}>
                  <View style={styles.calendarRowLeft}>
                    <View style={[styles.colorDot, { backgroundColor: calendar.color }]} />
                    <ThemedText type="small" numberOfLines={1} style={styles.calendarName}>
                      {calendar.summary}
                    </ThemedText>
                  </View>
                  <Switch
                    value={!hiddenCalendarIds.has(calendar.id)}
                    onValueChange={() => toggleCalendarHidden(calendar.id)}
                    trackColor={{ true: theme.tint }}
                  />
                </View>
              ))}
            </View>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTextGroup: {
    gap: Spacing.half,
    flex: 1,
  },
  locationSection: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  locationInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  locationInput: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  locationButton: {
    minWidth: 72,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  locationButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dropdown: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  dropdownRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
  calendarList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  calendarName: {
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
