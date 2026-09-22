import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BigEvent = {
  title: string;
  /** Optional supporting line — date, time, place, whatever the event needs. */
  detail?: string;
};

/**
 * The event featured in the Big Event card. Swap this out to feature a
 * different one; set it to null when there is nothing coming up.
 */
export const BIG_EVENT: BigEvent | null = {
  title: 'Back-to-back Google Technical Interviews',
};

/** Google's brand palette, which this card is themed on. */
const GoogleColors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
} as const;

/** #FBBC05 washes out on the app's lighter surfaces, so text darkens it there. */
const GoogleYellowOnLight = '#C68A00';

const StripeColors = [
  GoogleColors.blue,
  GoogleColors.red,
  GoogleColors.yellow,
  GoogleColors.green,
] as const;

const Wordmark = [
  { letter: 'G', color: 'blue' },
  { letter: 'o', color: 'red' },
  { letter: 'o', color: 'yellow' },
  { letter: 'g', color: 'blue' },
  { letter: 'l', color: 'green' },
  { letter: 'e', color: 'red' },
] as const;

/** Rec. 601 luma, which is plenty for choosing between two accent shades. */
function isLightSurface(hex: string): boolean {
  const value = parseInt(hex.replace('#', ''), 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export function BigEventCard({ event }: { event: BigEvent }) {
  const theme = useTheme();
  const onLight = isLightSurface(theme.backgroundElement);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.stripe}>
        {StripeColors.map((color) => (
          <View key={color} style={[styles.stripeSegment, { backgroundColor: color }]} />
        ))}
      </View>
      <View style={styles.body}>
        <View style={styles.wordmark} accessible accessibilityLabel="Google">
          {Wordmark.map(({ letter, color }, index) => (
            <ThemedText
              key={index}
              style={[
                styles.wordmarkLetter,
                {
                  color:
                    color === 'yellow' && onLight ? GoogleYellowOnLight : GoogleColors[color],
                },
              ]}>
              {letter}
            </ThemedText>
          ))}
        </View>
        <ThemedText style={styles.title}>{event.title}</ThemedText>
        {event.detail && (
          <ThemedText type="small" themeColor="textSecondary">
            {event.detail}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  stripe: {
    flexDirection: 'row',
    height: 6,
  },
  stripeSegment: {
    flex: 1,
  },
  body: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmarkLetter: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
});
