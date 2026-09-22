import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSchedule } from '@/context/schedule-context';
import { useTheme } from '@/hooks/use-theme';
import { ImportedEvent, parseImportFile } from '@/services/event-import';

function formatPreviewDate(event: ImportedEvent): string {
  if (event.isAllDay) return event.start;
  const start = new Date(event.start);
  return start.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ImportEventsScreen() {
  const theme = useTheme();
  const { addLocalEvent } = useSchedule();
  const [fileName, setFileName] = useState<string | null>(null);
  const [events, setEvents] = useState<ImportedEvent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const handlePickFile = async () => {
    setImportedCount(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/json', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    try {
      const file = new File(asset.uri);
      const text = await file.text();
      const { events: parsedEvents, errors: parseErrors } = parseImportFile(text, asset.name);
      setFileName(asset.name);
      setEvents(parsedEvents);
      setErrors(parseErrors);
    } catch (err) {
      setFileName(asset.name);
      setEvents([]);
      setErrors([err instanceof Error ? err.message : 'Failed to read file']);
    }
  };

  const handleImport = async () => {
    if (events.length === 0) return;
    setIsImporting(true);
    try {
      events.forEach((event) => addLocalEvent(event));
      setImportedCount(events.length);
      setEvents([]);
      setFileName(null);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
            <SymbolView name="chevron.left" tintColor={theme.text} size={20} />
          </Pressable>
          <ThemedText type="subtitle">Import Events</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              Import a CSV or JSON file of events prepared ahead of time. Each event needs a
              title and start date; end, all-day, and notes are optional.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              CSV columns: title, start, end, allDay, notes{'\n'}
              JSON: an array of {'{ title, start, end, isAllDay, notes }'}
            </ThemedText>
            <Pressable
              onPress={handlePickFile}
              style={({ pressed }) => [
                styles.pickButton,
                { backgroundColor: theme.tint },
                pressed && styles.pressed,
              ]}>
              <ThemedText style={styles.pickButtonText}>Choose File</ThemedText>
            </Pressable>
          </ThemedView>

          {importedCount !== null && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">
                Imported {importedCount} event{importedCount === 1 ? '' : 's'}.
              </ThemedText>
            </ThemedView>
          )}

          {fileName && (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {fileName} · {events.length} event{events.length === 1 ? '' : 's'} found
              </ThemedText>

              {errors.length > 0 && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">Skipped rows</ThemedText>
                  {errors.map((error, index) => (
                    <ThemedText key={index} type="small" themeColor="textSecondary">
                      {error}
                    </ThemedText>
                  ))}
                </ThemedView>
              )}

              {events.map((event, index) => (
                <ThemedView key={index} type="backgroundElement" style={styles.eventRow}>
                  <View style={styles.eventRowText}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {event.summary}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatPreviewDate(event)}
                    </ThemedText>
                  </View>
                </ThemedView>
              ))}

              {events.length > 0 && (
                <Pressable
                  onPress={handleImport}
                  disabled={isImporting}
                  style={({ pressed }) => [
                    styles.pickButton,
                    { backgroundColor: theme.tint },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={styles.pickButtonText}>
                    Import {events.length} Event{events.length === 1 ? '' : 's'}
                  </ThemedText>
                </Pressable>
              )}
            </>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  pickButton: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pickButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  eventRow: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  eventRowText: {
    gap: 2,
  },
});
