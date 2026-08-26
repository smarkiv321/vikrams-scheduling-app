import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSchedule } from '@/context/schedule-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, getEventDateKey } from '@/utils/event-dates';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getMonthWeeks(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function LogYearView() {
  const theme = useTheme();
  const { yearDisplayEvents, isLoadingYear, yearLoadError, yearLoadedForYear, loadYearEvents } =
    useSchedule();
  const year = new Date().getFullYear();

  useEffect(() => {
    if (yearLoadedForYear !== year) {
      loadYearEvents(year);
    }
  }, [year, yearLoadedForYear, loadYearEvents]);

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    for (const event of yearDisplayEvents) set.add(getEventDateKey(event));
    return set;
  }, [yearDisplayEvents]);

  const todayKey = formatDateKey(new Date());

  return (
    <View style={styles.container}>
      {isLoadingYear && yearDisplayEvents.length === 0 && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.tint} />
          <ThemedText themeColor="textSecondary">Loading year…</ThemedText>
        </View>
      )}

      {yearLoadError && (
        <ThemedText type="small" themeColor="textSecondary">
          {yearLoadError}
        </ThemedText>
      )}

      {Array.from({ length: 12 }, (_, month) => (
        <View key={month} style={styles.monthBlock}>
          <ThemedText type="smallBold" style={styles.monthLabel}>
            {MONTH_NAMES[month]}
          </ThemedText>
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, i) => (
              <ThemedText
                key={i}
                type="small"
                themeColor="textSecondary"
                style={styles.weekdayCell}>
                {label}
              </ThemedText>
            ))}
          </View>
          {getMonthWeeks(year, month).map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return <View key={dayIndex} style={styles.dayCell} />;
                }
                const dateKey = formatDateKey(new Date(year, month, day));
                const hasEvents = eventDates.has(dateKey);
                const isToday = dateKey === todayKey;
                return (
                  <Pressable
                    key={dayIndex}
                    style={styles.dayCell}
                    onPress={() => router.push(`/log/${dateKey}`)}>
                    <View
                      style={[
                        styles.dayCircle,
                        isToday && { borderColor: theme.tint, borderWidth: 1.5 },
                      ]}>
                      <ThemedText type="small" style={isToday ? { color: theme.tint } : undefined}>
                        {day}
                      </ThemedText>
                    </View>
                    {hasEvents && <View style={[styles.dot, { backgroundColor: theme.tint }]} />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
  monthBlock: {
    gap: Spacing.one,
  },
  monthLabel: {
    marginBottom: Spacing.one,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayCell: {
    flex: 1,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
