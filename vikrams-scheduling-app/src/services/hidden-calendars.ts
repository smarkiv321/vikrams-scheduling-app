import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'schedule.hiddenCalendarIds.v1';

export async function loadHiddenCalendarIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function saveHiddenCalendarIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
