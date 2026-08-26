import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  isAllDay: boolean;
  notes?: string;
  backgroundImageUri?: string;
};

const STORAGE_KEY = 'schedule.localEvents.v1';

export async function loadLocalEvents(): Promise<LocalEvent[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalEvent[];
  } catch {
    return [];
  }
}

export async function saveLocalEvents(events: LocalEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}
