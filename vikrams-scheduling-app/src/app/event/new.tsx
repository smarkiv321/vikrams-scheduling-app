import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSchedule } from '@/context/schedule-context';
import { useTheme } from '@/hooks/use-theme';

function roundToNextHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setMinutes(0, 0, 0);
  rounded.setHours(rounded.getHours() + 1);
  return rounded;
}

export default function NewEventScreen() {
  const theme = useTheme();
  const { addLocalEvent } = useSchedule();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [start, setStart] = useState(() => roundToNextHour(new Date()));
  const [end, setEnd] = useState(() => new Date(roundToNextHour(new Date()).getTime() + 60 * 60 * 1000));
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | undefined>();

  const canCreate = title.trim().length > 0;

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

  const handleCreate = () => {
    if (!canCreate) return;
    addLocalEvent({
      summary: title.trim(),
      notes: notes || undefined,
      backgroundImageUri,
      isAllDay,
      start: isAllDay ? start.toISOString().slice(0, 10) : start.toISOString(),
      end: isAllDay ? end.toISOString().slice(0, 10) : end.toISOString(),
    });
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
            <SymbolView name="chevron.left" tintColor={theme.text} size={20} />
          </Pressable>
          <Pressable
            onPress={handleCreate}
            hitSlop={8}
            disabled={!canCreate}
            style={styles.headerButton}>
            <ThemedText
              type="linkPrimary"
              style={!canCreate && { color: theme.textSecondary }}>
              Create
            </ThemedText>
          </Pressable>
        </View>
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

          <View style={styles.allDayRow}>
            <ThemedText type="smallBold">All day</ThemedText>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ true: theme.tint }}
            />
          </View>

          {!isAllDay && (
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
              <View style={styles.field}>
                <ThemedText type="smallBold">Ends</ThemedText>
                <DateTimePicker
                  value={end}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={(_, date) => date && setEnd(date)}
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
              placeholder="Add notes"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            This event only exists in this app and won&apos;t sync to Google Calendar.
          </ThemedText>
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
  allDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
