import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useEventOverrides } from '@/hooks/use-event-overrides';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useHiddenCalendars } from '@/hooks/use-hidden-calendars';
import { useLocalEvents } from '@/hooks/use-local-events';
import { applyOverride, DisplayEvent, EventOverride } from '@/services/event-overrides';
import {
  CalendarEvent,
  CalendarInfo,
  fetchCalendarList,
  fetchEventsForCalendars,
  fetchEventsInRange,
} from '@/services/google-calendar';
import { LocalEvent } from '@/services/local-events';

const LOCAL_EVENT_COLOR = '#E0703F';

function localEventToDisplayEvent(event: LocalEvent): DisplayEvent {
  return {
    id: event.id,
    summary: event.summary,
    start: event.start,
    end: event.end,
    isAllDay: event.isAllDay,
    calendarId: 'local',
    calendarName: 'My Events',
    color: LOCAL_EVENT_COLOR,
    notes: event.notes,
    backgroundImageUri: event.backgroundImageUri,
    isEdited: false,
    isLocal: true,
  };
}

type LoadMode = 'initial' | 'refresh';

type ScheduleContextValue = {
  accessToken: string | null;
  authError: string | null;
  authIsReady: boolean;
  isRestoringSession: boolean;
  signIn: () => void;
  displayEvents: DisplayEvent[];
  isLoadingEvents: boolean;
  isRefreshing: boolean;
  loadError: string | null;
  loadEvents: (mode?: LoadMode) => Promise<void>;
  setOverride: (id: string, patch: EventOverride) => void;
  clearOverride: (id: string) => void;
  addLocalEvent: (event: Omit<LocalEvent, 'id'>) => string;
  updateLocalEvent: (id: string, patch: Partial<Omit<LocalEvent, 'id'>>) => void;
  deleteLocalEvent: (id: string) => void;
  availableCalendars: CalendarInfo[];
  hiddenCalendarIds: Set<string>;
  toggleCalendarHidden: (id: string) => void;
  yearDisplayEvents: DisplayEvent[];
  isLoadingYear: boolean;
  yearLoadError: string | null;
  yearLoadedForYear: number | null;
  loadYearEvents: (year: number) => Promise<void>;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const {
    accessToken,
    error: authError,
    isReady: authIsReady,
    isRestoringSession,
    signIn,
  } = useGoogleAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableCalendars, setAvailableCalendars] = useState<CalendarInfo[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { overrides, setOverride, clearOverride } = useEventOverrides();
  const { localEvents, addLocalEvent, updateLocalEvent, deleteLocalEvent } = useLocalEvents();
  const { hiddenCalendarIds, toggleCalendarHidden } = useHiddenCalendars();

  const loadEvents = useCallback(
    async (mode: LoadMode = 'initial') => {
      if (!accessToken) return;
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoadingEvents(true);
      }
      setLoadError(null);
      try {
        const calendars = await fetchCalendarList(accessToken);
        setAvailableCalendars(calendars);
        const visibleCalendars = calendars.filter((cal) => !hiddenCalendarIds.has(cal.id));
        const upcoming = await fetchEventsForCalendars(accessToken, visibleCalendars);
        setEvents(upcoming);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        if (mode === 'refresh') {
          setIsRefreshing(false);
        } else {
          setIsLoadingEvents(false);
        }
      }
    },
    [accessToken, hiddenCalendarIds]
  );

  useEffect(() => {
    loadEvents('initial');
  }, [loadEvents]);

  const displayEvents = useMemo(() => {
    const googleEvents = events
      .filter((event) => !overrides[event.id]?.deleted)
      .map((event) => applyOverride(event, overrides[event.id]));
    const local = localEvents.map(localEventToDisplayEvent);
    return [...googleEvents, ...local].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [events, overrides, localEvents]);

  const [yearEvents, setYearEvents] = useState<CalendarEvent[]>([]);
  const [yearEventsForYear, setYearEventsForYear] = useState<number | null>(null);
  const [isLoadingYear, setIsLoadingYear] = useState(false);
  const [yearLoadError, setYearLoadError] = useState<string | null>(null);

  const loadYearEvents = useCallback(
    async (year: number) => {
      if (!accessToken) return;
      setIsLoadingYear(true);
      setYearLoadError(null);
      try {
        const calendars =
          availableCalendars.length > 0 ? availableCalendars : await fetchCalendarList(accessToken);
        const visibleCalendars = calendars.filter((cal) => !hiddenCalendarIds.has(cal.id));
        const timeMin = new Date(year, 0, 1).toISOString();
        const timeMax = new Date(year + 1, 0, 1).toISOString();
        const items = await fetchEventsInRange(accessToken, visibleCalendars, timeMin, timeMax);
        setYearEvents(items);
        setYearEventsForYear(year);
      } catch (err) {
        setYearLoadError(err instanceof Error ? err.message : 'Failed to load year events');
      } finally {
        setIsLoadingYear(false);
      }
    },
    [accessToken, availableCalendars, hiddenCalendarIds]
  );

  const yearDisplayEvents = useMemo(() => {
    const googleYearEvents = yearEvents
      .filter((event) => !overrides[event.id]?.deleted)
      .map((event) => applyOverride(event, overrides[event.id]));
    const localForYear = localEvents
      .map(localEventToDisplayEvent)
      .filter((event) => new Date(event.start).getFullYear() === yearEventsForYear);
    return [...googleYearEvents, ...localForYear].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [yearEvents, overrides, localEvents, yearEventsForYear]);

  const value = useMemo<ScheduleContextValue>(
    () => ({
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
      setOverride,
      clearOverride,
      addLocalEvent,
      updateLocalEvent,
      deleteLocalEvent,
      availableCalendars,
      hiddenCalendarIds,
      toggleCalendarHidden,
      yearDisplayEvents,
      isLoadingYear,
      yearLoadError,
      yearLoadedForYear: yearEventsForYear,
      loadYearEvents,
    }),
    [
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
      setOverride,
      clearOverride,
      addLocalEvent,
      updateLocalEvent,
      deleteLocalEvent,
      availableCalendars,
      hiddenCalendarIds,
      toggleCalendarHidden,
      yearDisplayEvents,
      isLoadingYear,
      yearLoadError,
      yearEventsForYear,
      loadYearEvents,
    ]
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule(): ScheduleContextValue {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
