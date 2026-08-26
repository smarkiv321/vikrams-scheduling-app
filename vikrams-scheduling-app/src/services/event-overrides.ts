import AsyncStorage from '@react-native-async-storage/async-storage';

import { CalendarEvent } from './google-calendar';

export type DisplayEvent = CalendarEvent & {
  notes?: string;
  backgroundImageUri?: string;
  itemsOrdered?: string;
  totalCost?: string;
  startFrom?: string;
  arriveTo?: string;
  isEdited: boolean;
  isLocal: boolean;
};

export function applyOverride(event: CalendarEvent, override?: EventOverride): DisplayEvent {
  if (!override) {
    return {
      ...event,
      notes: undefined,
      backgroundImageUri: undefined,
      itemsOrdered: undefined,
      totalCost: undefined,
      startFrom: undefined,
      arriveTo: undefined,
      isEdited: false,
      isLocal: false,
    };
  }
  return {
    ...event,
    summary: override.summary ?? event.summary,
    start: override.startISO ?? event.start,
    end: override.endISO ?? event.end,
    notes: override.notes,
    backgroundImageUri: override.backgroundImageUri,
    itemsOrdered: override.itemsOrdered,
    totalCost: override.totalCost,
    startFrom: override.startFrom,
    arriveTo: override.arriveTo,
    isEdited: true,
    isLocal: false,
  };
}

export type EventOverride = {
  summary?: string;
  startISO?: string;
  endISO?: string;
  notes?: string;
  backgroundImageUri?: string;
  itemsOrdered?: string;
  totalCost?: string;
  startFrom?: string;
  arriveTo?: string;
  deleted?: boolean;
};

const STORAGE_KEY = 'schedule.eventOverrides.v1';

export async function loadOverrides(): Promise<Record<string, EventOverride>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, EventOverride>;
  } catch {
    return {};
  }
}

export async function saveOverrides(overrides: Record<string, EventOverride>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}
