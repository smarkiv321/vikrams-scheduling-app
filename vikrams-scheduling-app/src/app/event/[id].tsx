import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSchedule } from '@/context/schedule-context';
import { useTheme } from '@/hooks/use-theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { displayEvents, setOverride, clearOverride, updateLocalEvent, deleteLocalEvent } =
    useSchedule();

  const event = useMemo(() => displayEvents.find((e) => e.id === id), [displayEvents, id]);

  const initialDuration = useMemo(() => {
    if (!event) return { hours: 0, minutes: 0, seconds: 0 };
    const totalSeconds = Math.max(
      0,
      Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 1000)
    );
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: Math.floor(totalSeconds % 60),
    };
  }, [event]);

  const [title, setTitle] = useState(event?.summary ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [start, setStart] = useState(() => new Date(event?.start ?? Date.now()));
  const [end, setEnd] = useState(() => new Date(event?.end ?? Date.now()));
  const [backgroundImageUri, setBackgroundImageUri] = useState(event?.backgroundImageUri);
  const [durationHours, setDurationHours] = useState(String(initialDuration.hours));
  const [durationMinutes, setDurationMinutes] = useState(String(initialDuration.minutes));
  const [durationSecondsInput, setDurationSecondsInput] = useState(String(initialDuration.seconds));
  const [itemsOrdered, setItemsOrdered] = useState(event?.itemsOrdered ?? '');
  const [totalCost, setTotalCost] = useState(event?.totalCost ?? '');
  const [startFrom, setStartFrom] = useState(event?.startFrom ?? '');
  const [arriveTo, setArriveTo] = useState(event?.arriveTo ?? '');

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary">This event is no longer available.</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="linkPrimary">Go back</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isTravel = event.calendarName === 'Travel';
  const isFood = event.calendarName === 'Food';

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setBackgroundImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    const effectiveEnd = isTravel
      ? new Date(
          start.getTime() +
            ((parseInt(durationHours, 10) || 0) * 3600 +
              (parseInt(durationMinutes, 10) || 0) * 60 +
              (parseInt(durationSecondsInput, 10) || 0)) *
              1000
        )
      : end;

    if (event.isLocal) {
      updateLocalEvent(event.id, {
        summary: title,
        notes: notes || undefined,
        backgroundImageUri,
        ...(event.isAllDay
          ? {}
          : { start: start.toISOString(), end: effectiveEnd.toISOString() }),
      });
    } else {
      setOverride(event.id, {
        summary: title,
        notes: notes || undefined,
        backgroundImageUri,
        itemsOrdered: isFood ? itemsOrdered || undefined : undefined,
        totalCost: isFood ? totalCost || undefined : undefined,
        startFrom: isTravel ? startFrom || undefined : undefined,
        arriveTo: isTravel ? arriveTo || undefined : undefined,
        ...(event.isAllDay
          ? {}
          : { startISO: start.toISOString(), endISO: effectiveEnd.toISOString() }),
      });
    }
    router.back();
  };

  const handleRevert = () => {
    clearOverride(event.id);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete event?',
      event.isLocal
        ? 'This permanently deletes this event from the app.'
        : 'This removes the event from the app only — it will stay on your Google Calendar.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (event.isLocal) {
              deleteLocalEvent(event.id);
            } else {
              setOverride(event.id, { deleted: true });
            }
            router.back();
          },
        },
      ]
    );
  };

  const Header = (
    <View style={styles.headerRow}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
        <SymbolView name="chevron.left" tintColor={theme.text} size={20} />
      </Pressable>
      <Pressable onPress={handleSave} hitSlop={8} style={styles.headerButton}>
        <ThemedText type="linkPrimary">Save</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {Header}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={handlePickImage}>
            {backgroundImageUri ? (
              <ImageBackground
                source={{ uri: backgroundImageUri }}
                style={styles.hero}
                imageStyle={styles.heroImage}>
                <View style={styles.heroOverlay}>
                  <ThemedText style={styles.heroActionText}>Change Background</ThemedText>
                </View>
              </ImageBackground>
            ) : (
              <ThemedView type="backgroundElement" style={[styles.hero, styles.heroEmpty]}>
                <SymbolView name="photo.badge.plus" tintColor={theme.textSecondary} size={28} />
                <ThemedText type="small" themeColor="textSecondary">
                  Add Background Image
                </ThemedText>
              </ThemedView>
            )}
          </Pressable>
          {backgroundImageUri && (
            <Pressable onPress={() => setBackgroundImageUri(undefined)}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.removeImageText}>
                Remove background image
              </ThemedText>
            </Pressable>
          )}

          <View style={styles.field}>
            <ThemedText type="smallBold">Title</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.backgroundElement },
              ]}
              placeholder="Event title"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {isTravel && (
            <>
              <View style={styles.field}>
                <ThemedText type="smallBold">Start from:</ThemedText>
                <TextInput
                  value={startFrom}
                  onChangeText={setStartFrom}
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                  placeholder="e.g. Home"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.field}>
                <ThemedText type="smallBold">Arrive to:</ThemedText>
                <TextInput
                  value={arriveTo}
                  onChangeText={setArriveTo}
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                  placeholder="e.g. Airport"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </>
          )}

          {!event.isAllDay && (
            <>
              <View style={styles.field}>
                <ThemedText type="smallBold">Starts</ThemedText>
                <DateTimePicker
                  value={start}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={(_, date) => date && setStart(date)}
                />
              </View>
              {isTravel ? (
                <View style={styles.field}>
                  <ThemedText type="smallBold">Duration</ThemedText>
                  <View style={styles.durationRow}>
                    <View style={styles.durationField}>
                      <TextInput
                        value={durationHours}
                        onChangeText={setDurationHours}
                        keyboardType="number-pad"
                        style={[
                          styles.input,
                          styles.durationInput,
                          { color: theme.text, backgroundColor: theme.backgroundElement },
                        ]}
                      />
                      <ThemedText type="small" themeColor="textSecondary">
                        hr
                      </ThemedText>
                    </View>
                    <View style={styles.durationField}>
                      <TextInput
                        value={durationMinutes}
                        onChangeText={setDurationMinutes}
                        keyboardType="number-pad"
                        style={[
                          styles.input,
                          styles.durationInput,
                          { color: theme.text, backgroundColor: theme.backgroundElement },
                        ]}
                      />
                      <ThemedText type="small" themeColor="textSecondary">
                        min
                      </ThemedText>
                    </View>
                    <View style={styles.durationField}>
                      <TextInput
                        value={durationSecondsInput}
                        onChangeText={setDurationSecondsInput}
                        keyboardType="number-pad"
                        style={[
                          styles.input,
                          styles.durationInput,
                          { color: theme.text, backgroundColor: theme.backgroundElement },
                        ]}
                      />
                      <ThemedText type="small" themeColor="textSecondary">
                        sec
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.field}>
                  <ThemedText type="smallBold">Ends</ThemedText>
                  <DateTimePicker
                    value={end}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={(_, date) => date && setEnd(date)}
                  />
                </View>
              )}
            </>
          )}

          {isFood && (
            <>
              <View style={styles.field}>
                <ThemedText type="smallBold">Items Ordered</ThemedText>
                <TextInput
                  value={itemsOrdered}
                  onChangeText={setItemsOrdered}
                  multiline
                  style={[
                    styles.input,
                    styles.notesInput,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                  placeholder="e.g. Burger, fries, shake"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.field}>
                <ThemedText type="smallBold">Total Cost</ThemedText>
                <TextInput
                  value={totalCost}
                  onChangeText={setTotalCost}
                  keyboardType="decimal-pad"
                  style={[
                    styles.input,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </>
          )}

          <View style={styles.field}>
            <ThemedText type="smallBold">Notes</ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[
                styles.input,
                styles.notesInput,
                { color: theme.text, backgroundColor: theme.backgroundElement },
              ]}
              placeholder="Add notes (only visible in this app)"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            {event.isLocal
              ? "This event only exists in this app and won't sync to Google Calendar."
              : "Changes are saved only in this app and won't sync back to Google Calendar."}
          </ThemedText>

          {!event.isLocal && event.isEdited && (
            <Pressable
              onPress={handleRevert}
              style={({ pressed }) => [styles.revertButton, pressed && styles.pressed]}>
              <ThemedText type="small" themeColor="textSecondary">
                Revert to Google&apos;s version
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
            <ThemedText type="small" style={styles.deleteButtonText}>
              Delete Event
            </ThemedText>
          </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  hero: {
    height: 160,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: Spacing.four,
  },
  heroEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  heroActionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  removeImageText: {
    textAlign: 'center',
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  durationField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  durationInput: {
    flex: 1,
    textAlign: 'center',
  },
  revertButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  deleteButtonText: {
    color: '#E5484D',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
