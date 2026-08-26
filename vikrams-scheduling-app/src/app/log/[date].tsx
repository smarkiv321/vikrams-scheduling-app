import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSchedule } from '@/context/schedule-context';
import { useTheme } from '@/hooks/use-theme';
import { getEventDateKey, parseDateKey } from '@/utils/event-dates';

function formatEventTime(start: string, end: string, isAllDay: boolean) {
  if (isAllDay) return 'All day';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${startDate.toLocaleTimeString(undefined, timeFormat)} – ${endDate.toLocaleTimeString(undefined, timeFormat)}`;
}

export default function LogDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const theme = useTheme();
  const { yearDisplayEvents, isLoadingYear } = useSchedule();

  const dayEvents = useMemo(
    () => yearDisplayEvents.filter((event) => getEventDateKey(event) === date),
    [yearDisplayEvents, date]
  );

  const title = date
    ? parseDateKey(date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
            <SymbolView name="chevron.left" tintColor={theme.text} size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>

          {isLoadingYear && dayEvents.length === 0 && (
            <ThemedText themeColor="textSecondary">Loading…</ThemedText>
          )}

          {!isLoadingYear && dayEvents.length === 0 && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText themeColor="textSecondary">No events on this date.</ThemedText>
            </ThemedView>
          )}

          {dayEvents.map((event) => (
            <Pressable key={event.id} onPress={() => router.push(`/event/${event.id}`)}>
              <ThemedView type="backgroundElement" style={styles.eventCard}>
                <View style={styles.eventRow}>
                  <View style={[styles.colorDot, { backgroundColor: event.color }]} />
                  <ThemedText type="smallBold" style={styles.eventSummary}>
                    {event.summary}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatEventTime(event.start, event.end, event.isAllDay)} · {event.calendarName}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ScrollView>
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
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  headerButton: {
    padding: Spacing.one,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.one,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
  eventCard: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventSummary: {
    flex: 1,
  },
});
