export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  isAllDay: boolean;
  calendarId: string;
  calendarName: string;
  color: string;
};

export type CalendarInfo = {
  id: string;
  summary: string;
  color: string;
};

type GoogleCalendarApiEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleCalendarListEntry = {
  id: string;
  summary: string;
  backgroundColor?: string;
  selected?: boolean;
};

const API_ROOT = 'https://www.googleapis.com/calendar/v3';

async function callApi(accessToken: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API_ROOT}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${body}`);
  }

  return res.json();
}

function mapEvent(
  item: GoogleCalendarApiEvent,
  calendar: { id: string; summary: string; color: string }
): CalendarEvent {
  const start = item.start?.dateTime ?? item.start?.date ?? '';
  const end = item.end?.dateTime ?? item.end?.date ?? '';
  return {
    id: item.id,
    summary: item.summary ?? '(No title)',
    start,
    end,
    isAllDay: !item.start?.dateTime,
    calendarId: calendar.id,
    calendarName: calendar.summary,
    color: calendar.color,
  };
}

export async function fetchCalendarList(accessToken: string): Promise<CalendarInfo[]> {
  const data = await callApi(accessToken, '/users/me/calendarList');
  return ((data.items ?? []) as GoogleCalendarListEntry[])
    .filter((entry) => entry.selected !== false)
    .map((entry) => ({
      id: entry.id,
      summary: entry.summary,
      color: entry.backgroundColor ?? '#8C7361',
    }));
}

async function fetchEventsForCalendar(
  accessToken: string,
  calendar: CalendarInfo,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: '250',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const data = await callApi(
    accessToken,
    `/calendars/${encodeURIComponent(calendar.id)}/events?${params.toString()}`
  );
  return ((data.items ?? []) as GoogleCalendarApiEvent[]).map((item) => mapEvent(item, calendar));
}

export async function fetchEventsInRange(
  accessToken: string,
  calendars: CalendarInfo[],
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const eventsByCalendar = await Promise.all(
    calendars.map((calendar) => fetchEventsForCalendar(accessToken, calendar, timeMin, timeMax))
  );

  return eventsByCalendar
    .flat()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export async function fetchEventsForCalendars(
  accessToken: string,
  calendars: CalendarInfo[],
  daysAhead = 7
): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timeMin = startOfToday.toISOString();
  const rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
  const timeMax = rangeEnd.toISOString();

  return fetchEventsInRange(accessToken, calendars, timeMin, timeMax);
}

export async function fetchUpcomingEvents(
  accessToken: string,
  daysAhead = 7
): Promise<CalendarEvent[]> {
  const calendars = await fetchCalendarList(accessToken);
  return fetchEventsForCalendars(accessToken, calendars, daysAhead);
}

export async function createEvent(
  accessToken: string,
  event: { summary: string; startISO: string; endISO: string; calendarId?: string }
): Promise<void> {
  await callApi(
    accessToken,
    `/calendars/${encodeURIComponent(event.calendarId ?? 'primary')}/events`,
    {
      method: 'POST',
      body: JSON.stringify({
        summary: event.summary,
        start: { dateTime: event.startISO },
        end: { dateTime: event.endISO },
      }),
    }
  );
}
