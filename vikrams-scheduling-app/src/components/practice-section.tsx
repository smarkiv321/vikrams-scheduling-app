import { Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ComponentProps, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePracticeProgress } from '@/hooks/use-practice-progress';
import { useTheme, type Theme } from '@/hooks/use-theme';
import { NEETCODE_150, PracticePattern, problemUrl } from '@/services/neetcode-150';
import { PracticeStats, SolvedEntry } from '@/services/practice-progress';
import { formatDateKey, parseDateKey } from '@/utils/event-dates';

/** Reserved for "done" states, so completion never depends on the weather palette. */
const SuccessGreen = '#34A853';

/** Above this many, a row of dots stops fitting on a phone. */
const MAX_DOTS = 8;

function formatFinishDate(date: Date) {
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * The one line that tells you what to do right now. Ordered so the most
 * motivating framing available wins.
 */
function getMomentumLine(stats: PracticeStats) {
  if (stats.solvedCount >= stats.total) {
    return 'NeetCode 150 complete. Every pattern, done.';
  }
  if (stats.metToday) {
    return stats.streak > 1
      ? `Today's done — ${stats.streak}-day streak locked in.`
      : "Today's done. That's how the streak starts.";
  }
  if (stats.streakAtRisk) {
    return `One problem keeps your ${stats.streak}-day streak alive.`;
  }
  if (stats.solvedToday > 0) {
    const left = stats.dailyTarget - stats.solvedToday;
    return `${left} more ${left === 1 ? 'problem' : 'problems'} and today is done.`;
  }
  return stats.dailyTarget >= 10
    ? `${stats.dailyTarget} problems today. One at a time.`
    : `${stats.dailyTarget} ${stats.dailyTarget === 1 ? 'problem' : 'problems'} today. That's the whole ask.`;
}

function ProgressBar({ percent, theme }: { percent: number; theme: Theme }) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.max(percent, 1)}%`, backgroundColor: theme.tint },
        ]}
      />
    </View>
  );
}

function TodayDots({ stats, theme }: { stats: PracticeStats; theme: Theme }) {
  if (stats.dailyTarget > MAX_DOTS) {
    const filled = Math.min(stats.solvedToday / stats.dailyTarget, 1) * 100;
    return (
      <View style={styles.todayCountGroup}>
        <ThemedText type="smallBold" style={stats.metToday ? { color: SuccessGreen } : undefined}>
          {stats.solvedToday}/{stats.dailyTarget}
        </ThemedText>
        <View style={[styles.miniTrack, { backgroundColor: theme.backgroundSelected }]}>
          <View
            style={[
              styles.miniFill,
              {
                width: `${filled}%`,
                backgroundColor: stats.metToday ? SuccessGreen : theme.tint,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.dotRow}>
      {Array.from({ length: stats.dailyTarget }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index < stats.solvedToday ? SuccessGreen : 'transparent',
              borderColor: index < stats.solvedToday ? SuccessGreen : theme.textSecondary,
            },
          ]}
        />
      ))}
      {stats.solvedToday > stats.dailyTarget && (
        <ThemedText type="small" style={{ color: SuccessGreen }}>
          +{stats.solvedToday - stats.dailyTarget}
        </ThemedText>
      )}
    </View>
  );
}

function FactRow({
  icon,
  children,
  theme,
}: {
  icon: ComponentProps<typeof SymbolView>['name'];
  children: React.ReactNode;
  theme: Theme;
}) {
  return (
    <View style={styles.factRow}>
      <SymbolView name={icon} size={13} tintColor={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.factText}>
        {children}
      </ThemedText>
    </View>
  );
}

function PatternRow({
  pattern,
  solvedCount,
  solvedSlugs,
  onToggle,
  theme,
}: {
  pattern: PracticePattern;
  solvedCount: number;
  solvedSlugs: Set<string>;
  onToggle: (slug: string) => void;
  theme: Theme;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isComplete = solvedCount === pattern.problems.length;

  return (
    <ThemedView type="backgroundElement" style={styles.patternCard}>
      <Pressable
        onPress={() => setIsOpen((open) => !open)}
        style={({ pressed }) => [styles.patternHeader, pressed && styles.pressed]}>
        <SymbolView
          name="chevron.right"
          size={11}
          weight="bold"
          tintColor={theme.textSecondary}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />
        <ThemedText type="smallBold" style={styles.patternName} numberOfLines={1}>
          {pattern.name}
        </ThemedText>
        {isComplete && <SymbolView name="checkmark.seal.fill" size={15} tintColor={SuccessGreen} />}
        <ThemedText type="small" themeColor="textSecondary">
          {solvedCount}/{pattern.problems.length}
        </ThemedText>
      </Pressable>

      {isOpen && (
        <View style={styles.problemList}>
          {pattern.problems.map((problem) => {
            const isSolved = solvedSlugs.has(problem.slug);
            return (
              <View key={problem.slug} style={styles.problemRow}>
                <Pressable onPress={() => onToggle(problem.slug)} hitSlop={10}>
                  <SymbolView
                    name={isSolved ? 'checkmark.circle.fill' : 'circle'}
                    size={21}
                    tintColor={isSolved ? SuccessGreen : theme.textSecondary}
                  />
                </Pressable>
                <ExternalLink href={problemUrl(problem.slug) as Href & string} asChild>
                  <Pressable style={styles.problemTitleWrap}>
                    <ThemedText
                      type="small"
                      style={isSolved ? styles.problemSolved : undefined}
                      numberOfLines={1}>
                      {problem.title}
                    </ThemedText>
                  </Pressable>
                </ExternalLink>
              </View>
            );
          })}
        </View>
      )}
    </ThemedView>
  );
}

/** How many recent entries show before "Show earlier" is needed. */
const LOG_PREVIEW_COUNT = 5;

function formatLogDate(dateKey: string, today: Date) {
  if (dateKey === formatDateKey(today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === formatDateKey(yesterday)) return 'Yesterday';
  return parseDateKey(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function LeetCodeLog({
  entries,
  onAdd,
  onRemove,
  theme,
}: {
  entries: SolvedEntry[];
  onAdd: (title: string) => void;
  onRemove: (slug: string) => void;
  theme: Theme;
}) {
  const [input, setInput] = useState('');
  const [showAll, setShowAll] = useState(false);
  const today = new Date();

  const submit = () => {
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
  };

  const visible = showAll ? entries : entries.slice(0, LOG_PREVIEW_COUNT);

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" style={styles.sectionLabel}>
        LeetCode Log
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSubtitle}>
        Solved something off the roadmap? Jot it down — it still counts toward today and the streak.
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.logInputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submit}
            returnKeyType="done"
            placeholder="Problem name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.logInput, { color: theme.text, backgroundColor: theme.background }]}
          />
          <Pressable
            onPress={submit}
            disabled={!input.trim()}
            style={({ pressed }) => [
              styles.logButton,
              { backgroundColor: theme.tint, opacity: input.trim() ? 1 : 0.5 },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.logButtonText}>
              Log it
            </ThemedText>
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.logEmpty}>
            Nothing logged yet — anything you solve outside the 150 goes here.
          </ThemedText>
        ) : (
          <View style={styles.logList}>
            {visible.map((entry) => (
              <View key={entry.slug} style={styles.logRow}>
                <View style={styles.logRowText}>
                  <ThemedText type="small" numberOfLines={1}>
                    {entry.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatLogDate(entry.solvedOn, today)}
                  </ThemedText>
                </View>
                <Pressable onPress={() => onRemove(entry.slug)} hitSlop={10}>
                  <SymbolView name="xmark.circle.fill" size={19} tintColor={theme.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {entries.length > LOG_PREVIEW_COUNT && (
          <Pressable onPress={() => setShowAll((open) => !open)} hitSlop={8}>
            <ThemedText type="small" style={{ color: theme.tint }}>
              {showAll ? 'Show less' : `Show earlier entries (${entries.length - LOG_PREVIEW_COUNT})`}
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </View>
  );
}

export function PracticeSection({ openInternshipCount }: { openInternshipCount: number }) {
  const theme = useTheme();
  const {
    isLoaded,
    stats,
    solvedSlugs,
    lastSolvedSlug,
    logEntries,
    markSolved,
    unmarkSolved,
    toggleSolved,
    undoLast,
    logProblem,
    cycleDailyTarget,
  } = usePracticeProgress();
  const [skipOffset, setSkipOffset] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const current =
    stats.unsolved.length > 0 ? stats.unsolved[skipOffset % stats.unsolved.length] : null;
  const currentPattern = current
    ? NEETCODE_150.find((pattern) => pattern.name === current.pattern)
    : null;

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" style={styles.sectionLabel}>
        NeetCode 150
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSubtitle}>
        Reps for the internships below and the interviews on Home
      </ThemedText>

      {!isLoaded ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.tint} />
          <ThemedText themeColor="textSecondary">Loading your progress…</ThemedText>
        </View>
      ) : (
        <>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.streakGroup}>
                <ThemedText style={styles.streakFlame}>{stats.streak > 0 ? '🔥' : '✨'}</ThemedText>
                <ThemedText type="smallBold">
                  {stats.streak > 0 ? `${stats.streak}-day streak` : 'No streak yet'}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {stats.solvedCount}/{stats.total} · {stats.percent}%
              </ThemedText>
            </View>

            <ProgressBar percent={stats.percent} theme={theme} />

            <View style={[styles.todayRow, { borderTopColor: theme.backgroundSelected }]}>
              <View style={styles.todayLeft}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                  TODAY
                </ThemedText>
                <TodayDots stats={stats} theme={theme} />
                {stats.metToday && (
                  <SymbolView name="checkmark.circle.fill" size={16} tintColor={SuccessGreen} />
                )}
              </View>
              <Pressable
                onPress={cycleDailyTarget}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.targetChip,
                  { borderColor: theme.textSecondary },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Goal {stats.dailyTarget}/day
                </ThemedText>
              </Pressable>
            </View>

            <ThemedText
              type="smallBold"
              style={[styles.momentumLine, stats.metToday && { color: SuccessGreen }]}>
              {getMomentumLine(stats)}
            </ThemedText>

            {current && currentPattern && (
              <View style={[styles.nextBlock, { borderColor: theme.backgroundSelected }]}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                  NEXT UP
                </ThemedText>
                <ThemedText type="smallBold" style={styles.nextTitle}>
                  {current.problem.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {current.pattern} · {stats.solvedByPattern.get(current.pattern) ?? 0}/
                  {currentPattern.problems.length} solved
                </ThemedText>

                <View style={styles.actionRow}>
                  <ExternalLink href={problemUrl(current.problem.slug) as Href & string} asChild>
                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryButton,
                        { backgroundColor: theme.tint },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold" style={styles.primaryButtonText}>
                        Open problem
                      </ThemedText>
                    </Pressable>
                  </ExternalLink>
                  <Pressable
                    onPress={() => {
                      markSolved(current.problem.slug);
                      setSkipOffset(0);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      { borderColor: theme.tint },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView name="checkmark" size={13} weight="bold" tintColor={theme.tint} />
                    <ThemedText type="smallBold" style={{ color: theme.tint }}>
                      Solved
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.microActions}>
                  {stats.unsolved.length > 1 && (
                    <Pressable onPress={() => setSkipOffset((offset) => offset + 1)} hitSlop={8}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Not this one
                      </ThemedText>
                    </Pressable>
                  )}
                  {lastSolvedSlug && (
                    <Pressable onPress={undoLast} hitSlop={8}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Undo last
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            <View style={styles.factList}>
              {stats.nextMilestone && (
                <FactRow icon="flag.checkered" theme={theme}>
                  {stats.toNextMilestone} more to hit {stats.nextMilestone} solved
                </FactRow>
              )}
              {stats.projectedFinish && (
                <FactRow icon="calendar" theme={theme}>
                  At {stats.dailyTarget}/day you finish all {stats.total} by{' '}
                  {formatFinishDate(stats.projectedFinish)}
                </FactRow>
              )}
              {openInternshipCount > 0 && (
                <FactRow icon="briefcase" theme={theme}>
                  {openInternshipCount} internships listed below — this is what gets you through
                  their loops
                </FactRow>
              )}
            </View>
          </ThemedView>

          <LeetCodeLog entries={logEntries} onAdd={logProblem} onRemove={unmarkSolved} theme={theme} />

          <Pressable
            onPress={() => setShowAll((open) => !open)}
            style={({ pressed }) => [styles.browseToggle, pressed && styles.pressed]}>
            <SymbolView
              name="chevron.right"
              size={11}
              weight="bold"
              tintColor={theme.tint}
              style={{ transform: [{ rotate: showAll ? '90deg' : '0deg' }] }}
            />
            <ThemedText type="small" style={{ color: theme.tint }}>
              {showAll ? 'Hide the full list' : 'Browse all 150 by pattern'}
            </ThemedText>
          </Pressable>

          {showAll &&
            NEETCODE_150.map((pattern) => (
              <PatternRow
                key={pattern.name}
                pattern={pattern}
                solvedCount={stats.solvedByPattern.get(pattern.name) ?? 0}
                solvedSlugs={solvedSlugs}
                onToggle={toggleSolved}
                theme={theme}
              />
            ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 20,
  },
  sectionSubtitle: {
    marginTop: -Spacing.one,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  streakFlame: {
    fontSize: 15,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  todayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  todayCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  miniTrack: {
    width: 84,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 3,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  targetChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  momentumLine: {
    marginTop: Spacing.half,
  },
  nextBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
  nextTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  microActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  factList: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  factText: {
    flex: 1,
    fontSize: 13,
  },
  logInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  logInput: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  logButton: {
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  logButtonText: {
    color: '#ffffff',
  },
  logEmpty: {
    marginTop: Spacing.two,
  },
  logList: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logRowText: {
    flex: 1,
    gap: Spacing.half,
  },
  browseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
  },
  patternCard: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  patternName: {
    flex: 1,
  },
  problemList: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  problemTitleWrap: {
    flex: 1,
  },
  problemSolved: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  pressed: {
    opacity: 0.7,
  },
});
