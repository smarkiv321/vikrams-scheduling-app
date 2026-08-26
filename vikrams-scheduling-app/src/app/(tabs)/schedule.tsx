import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogYearView } from '@/components/log-year-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSchedule } from '@/context/schedule-context';
import { useTheme, type Theme } from '@/hooks/use-theme';
import { DisplayEvent } from '@/services/event-overrides';

function formatEventTime(event: DisplayEvent) {
  if (event.isAllDay) {
    return 'All day';
  }
  const start = new Date(event.start);
  const end = new Date(event.end);
  const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${start.toLocaleTimeString(undefined, timeFormat)} – ${end.toLocaleTimeString(undefined, timeFormat)}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getEventDay(event: DisplayEvent): { key: string; date: Date } {
  const date = event.isAllDay
    ? (() => {
        const [year, month, day] = event.start.split('-').map(Number);
        return new Date(year, month - 1, day);
      })()
    : startOfDay(new Date(event.start));
  return { key: dayKey(date), date };
}

function getDayLabel(date: Date): string {
  const diffDays = Math.round((date.getTime() - startOfDay(new Date()).getTime()) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const CHECKED_EVENT_HIDE_DELAY_MS = 3000;

type EventGroup = { key: string; label: string; events: DisplayEvent[] };

function groupEventsByDay(events: DisplayEvent[]): EventGroup[] {
  const groups = new Map<string, EventGroup>();
  for (const event of events) {
    const { key, date } = getEventDay(event);
    if (!groups.has(key)) {
      groups.set(key, { key, label: getDayLabel(date), events: [] });
    }
    groups.get(key)!.events.push(event);
  }
  return Array.from(groups.values());
}

type EventCardProps = {
  event: DisplayEvent;
  theme: Theme;
  checkable: boolean;
  isChecked?: boolean;
  onToggle?: () => void;
  onPress: () => void;
};

function EventCard({ event, theme, checkable, isChecked, onToggle, onPress }: EventCardProps) {
  const cardBody = (
    <>
      <Pressable style={styles.eventCardContent} onPress={onPress}>
        <View style={styles.eventCardRow}>
          <View style={[styles.colorDot, { backgroundColor: event.color }]} />
          <ThemedText
            type="smallBold"
            style={[styles.eventSummary, event.backgroundImageUri && styles.eventSummaryOnImage]}>
            {event.summary}
          </ThemedText>
          {event.isEdited && (
            <SymbolView
              name="pencil"
              tintColor={event.backgroundImageUri ? '#ffffff' : theme.tint}
              size={12}
            />
          )}
        </View>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={event.backgroundImageUri && styles.eventSubtitleOnImage}>
          {formatEventTime(event)} · {event.calendarName}
        </ThemedText>
      </Pressable>
      {checkable && (
        <Pressable onPress={onToggle} hitSlop={8}>
          <SymbolView
            name={isChecked ? 'checkmark.circle.fill' : 'circle'}
            tintColor={isChecked ? '#0A84FF' : theme.textSecondary}
            size={34.56}
          />
        </Pressable>
      )}
    </>
  );

  if (event.backgroundImageUri) {
    return (
      <ImageBackground
        source={{ uri: event.backgroundImageUri }}
        style={styles.eventCard}
        imageStyle={styles.eventCardImage}>
        <View style={styles.eventCardImageOverlay} />
        {cardBody}
      </ImageBackground>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.eventCard}>
      {cardBody}
    </ThemedView>
  );
}

type ViewMode = 'mainstream' | 'today' | 'log';

export default function ScheduleScreen() {
  const theme = useTheme();
  const {
    accessToken,
    authError,
    authIsReady,
    isRestoringSession,
    signIn,
    displayEvents,
    isLoadingEvents,
    isRefreshing,
    loadError,
    loadEvents,
  } = useSchedule();
  const [checkedEventIds, setCheckedEventIds] = useState<Set<string>>(new Set());
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('mainstream');
  const pendingHideTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = pendingHideTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleToggleEvent = useCallback((id: string) => {
    setCheckedEventIds((prev) => {
      const next = new Set(prev);
      const pendingTimer = pendingHideTimers.current.get(id);

      if (next.has(id)) {
        next.delete(id);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          pendingHideTimers.current.delete(id);
        }
      } else {
        next.add(id);
        pendingHideTimers.current.set(
          id,
          setTimeout(() => {
            setHiddenEventIds((prevHidden) => new Set(prevHidden).add(id));
            pendingHideTimers.current.delete(id);
          }, CHECKED_EVENT_HIDE_DELAY_MS)
        );
      }
      return next;
    });
  }, []);

  const visibleEvents = useMemo(
    () => displayEvents.filter((event) => !hiddenEventIds.has(event.id)),
    [displayEvents, hiddenEventIds]
  );
  const groupedEvents = useMemo(() => groupEventsByDay(visibleEvents), [visibleEvents]);

  const todayEvents = useMemo(() => {
    const todayKey = dayKey(startOfDay(new Date()));
    return displayEvents.filter((event) => getEventDay(event).key === todayKey);
  }, [displayEvents]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Schedule
        </ThemedText>

        {accessToken && (
          <View style={styles.segmentedControl}>
            <Pressable
              onPress={() => setViewMode('mainstream')}
              style={[
                styles.segment,
                viewMode === 'mainstream' && { backgroundColor: theme.tint },
              ]}>
              <ThemedText
                type="smallBold"
                themeColor={viewMode === 'mainstream' ? undefined : 'textSecondary'}
                style={viewMode === 'mainstream' && styles.segmentTextActive}>
                Mainstream
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('today')}
              style={[styles.segment, viewMode === 'today' && { backgroundColor: theme.tint }]}>
              <ThemedText
                type="smallBold"
                themeColor={viewMode === 'today' ? undefined : 'textSecondary'}
                style={viewMode === 'today' && styles.segmentTextActive}>
                Today's Events
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('log')}
              style={[styles.segment, viewMode === 'log' && { backgroundColor: theme.tint }]}>
              <ThemedText
                type="smallBold"
                themeColor={viewMode === 'log' ? undefined : 'textSecondary'}
                style={viewMode === 'log' && styles.segmentTextActive}>
                Log
              </ThemedText>
            </Pressable>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            accessToken ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadEvents('refresh')}
                tintColor={theme.tint}
              />
            ) : undefined
          }>
          {!accessToken && !isRestoringSession && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText themeColor="textSecondary" style={styles.signInCopy}>
                Connect your Google Calendar to see your upcoming events.
              </ThemedText>
              <Pressable
                disabled={!authIsReady}
                onPress={signIn}
                style={({ pressed }) => [
                  styles.signInButton,
                  { backgroundColor: theme.tint },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.signInButtonText}>Connect Google Calendar</ThemedText>
              </Pressable>
              {authError && (
                <ThemedText themeColor="textSecondary" type="small">
                  {authError}
                </ThemedText>
              )}
            </ThemedView>
          )}

          {accessToken && isLoadingEvents && (
            <ThemedView style={styles.loadingRow}>
              <ActivityIndicator color={theme.tint} />
              <ThemedText themeColor="textSecondary">Loading events…</ThemedText>
            </ThemedView>
          )}

          {accessToken && loadError && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText themeColor="textSecondary">{loadError}</ThemedText>
            </ThemedView>
          )}

          {!isLoadingEvents && !loadError && viewMode === 'mainstream' && (
            <>
              {visibleEvents.length === 0 && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText themeColor="textSecondary">No upcoming events.</ThemedText>
                </ThemedView>
              )}
              {groupedEvents.map((group) => (
                <View key={group.key} style={styles.dayGroup}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.dayLabel}>
                    {group.label}
                  </ThemedText>
                  {group.events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      theme={theme}
                      checkable
                      isChecked={checkedEventIds.has(event.id)}
                      onToggle={() => handleToggleEvent(event.id)}
                      onPress={() => router.push(`/event/${event.id}`)}
                    />
                  ))}
                </View>
              ))}
            </>
          )}

          {!isLoadingEvents && !loadError && viewMode === 'today' && (
            <>
              {todayEvents.length === 0 && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText themeColor="textSecondary">No events today.</ThemedText>
                </ThemedView>
              )}
              {todayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  theme={theme}
                  checkable={false}
                  onPress={() => router.push(`/event/${event.id}`)}
                />
              ))}
            </>
          )}

          {viewMode === 'log' && <LogYearView />}
        </ScrollView>

        <Pressable
          onPress={() => router.push('/event/new')}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.tint },
            pressed && styles.pressed,
          ]}>
          <SymbolView name="plus" tintColor="#ffffff" size={24} weight="semibold" />
        </Pressable>
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
    paddingTop: Spacing.four,
  },
  title: {
    paddingHorizontal: Spacing.four,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    padding: 4,
    borderRadius: Spacing.four,
    backgroundColor: 'rgba(140, 115, 97, 0.15)',
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  signInCopy: {
    textAlign: 'center',
  },
  signInButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  dayGroup: {
    gap: Spacing.two,
  },
  dayLabel: {
    paddingLeft: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  eventCardImage: {
    borderRadius: Spacing.three,
  },
  eventCardImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  eventCardContent: {
    flex: 1,
    gap: Spacing.one,
  },
  eventCardRow: {
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
  eventSummaryOnImage: {
    color: '#ffffff',
  },
  eventSubtitleOnImage: {
    color: 'rgba(255,255,255,0.85)',
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.six,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
