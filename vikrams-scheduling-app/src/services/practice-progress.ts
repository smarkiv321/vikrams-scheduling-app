import AsyncStorage from '@react-native-async-storage/async-storage';

import { NEETCODE_150_ORDER, NEETCODE_150_TOTAL, PracticeProblem } from '@/services/neetcode-150';
import { formatDateKey } from '@/utils/event-dates';

const STORAGE_KEY = 'schedule.practiceProgress.v1';

export type SolvedEntry = {
  slug: string;
  /** Local date key (YYYY-MM-DD) the problem was marked solved. */
  solvedOn: string;
  /**
   * Present only for a manually logged problem outside the roadmap — its
   * slug is synthetic, so the free-text name is what gets displayed.
   */
  title?: string;
};

/** Prefix for synthetic slugs, so a manual log entry can never collide with
 *  a real roadmap slug and get counted toward the NeetCode 150 total. */
export const LOG_SLUG_PREFIX = 'log-';

export function generateLogSlug(): string {
  return `${LOG_SLUG_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type PracticeProgress = {
  version: number;
  solved: SolvedEntry[];
  dailyTarget: number;
};

export const DAILY_TARGET_OPTIONS: readonly number[] = [1, 2, 3, 5, 10, 20];
export const DEFAULT_DAILY_TARGET = 20;

/** Bumped when a stored default needs to be re-applied to existing progress. */
const CURRENT_VERSION = 2;

/** Counts worth celebrating on the way to 150. */
const MILESTONES = [1, 5, 10, 25, 50, 75, 100, 125, 150];

/** Bounds the streak walk so a long-dormant history can't spin. */
const MAX_STREAK_LOOKBACK_DAYS = 400;

const EMPTY_PROGRESS: PracticeProgress = {
  version: CURRENT_VERSION,
  solved: [],
  dailyTarget: DEFAULT_DAILY_TARGET,
};

export async function loadPracticeProgress(): Promise<PracticeProgress> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as Partial<PracticeProgress>;
    const solved = Array.isArray(parsed.solved) ? parsed.solved : [];
    // v1 shipped a 2/day default. Keep solved work, but re-apply the new
    // default once so an old stored target doesn't override it silently.
    const isStale = (parsed.version ?? 1) < CURRENT_VERSION;
    return {
      version: CURRENT_VERSION,
      solved,
      dailyTarget: isStale ? DEFAULT_DAILY_TARGET : parsed.dailyTarget ?? DEFAULT_DAILY_TARGET,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function savePracticeProgress(progress: PracticeProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Consecutive days that hit the daily target, walking back from today.
 *
 * A single missed day is forgiven — only two misses in a row end the run. The
 * all-or-nothing streak is what makes people quit after one bad day, and the
 * point of this section is to survive bad days.
 */
export function computeStreak(
  countsByDay: Map<string, number>,
  dailyTarget: number,
  today: Date
): number {
  let streak = 0;
  let consecutiveMisses = 0;
  // Today is still in progress, so not having hit the target yet is not a miss.
  let cursor = (countsByDay.get(formatDateKey(today)) ?? 0) >= dailyTarget ? today : addDays(today, -1);

  for (let day = 0; day < MAX_STREAK_LOOKBACK_DAYS; day++) {
    if ((countsByDay.get(formatDateKey(cursor)) ?? 0) >= dailyTarget) {
      streak += 1;
      consecutiveMisses = 0;
    } else {
      consecutiveMisses += 1;
      if (consecutiveMisses >= 2) break;
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export type PracticeStats = {
  solvedCount: number;
  total: number;
  percent: number;
  solvedToday: number;
  dailyTarget: number;
  metToday: boolean;
  streak: number;
  /** True when today is the day that decides whether the streak survives. */
  streakAtRisk: boolean;
  /** Problems still unsolved, in roadmap order. */
  unsolved: { problem: PracticeProblem; pattern: string }[];
  solvedByPattern: Map<string, number>;
  nextMilestone: number | null;
  toNextMilestone: number;
  /** When the remaining problems run out at the current daily target. */
  projectedFinish: Date | null;
};

export function computeStats(progress: PracticeProgress, today = new Date()): PracticeStats {
  const solvedSlugs = new Set(progress.solved.map((entry) => entry.slug));

  const countsByDay = new Map<string, number>();
  for (const entry of progress.solved) {
    countsByDay.set(entry.solvedOn, (countsByDay.get(entry.solvedOn) ?? 0) + 1);
  }

  const solvedByPattern = new Map<string, number>();
  const unsolved: { problem: PracticeProblem; pattern: string }[] = [];
  for (const item of NEETCODE_150_ORDER) {
    if (solvedSlugs.has(item.problem.slug)) {
      solvedByPattern.set(item.pattern, (solvedByPattern.get(item.pattern) ?? 0) + 1);
    } else {
      unsolved.push(item);
    }
  }

  // Count only slugs still in the roadmap, so progress can't be inflated by
  // entries left behind if a problem is ever renamed or dropped from the list.
  const solvedCount = NEETCODE_150_TOTAL - unsolved.length;
  const solvedToday = countsByDay.get(formatDateKey(today)) ?? 0;
  const metToday = solvedToday >= progress.dailyTarget;
  const streak = computeStreak(countsByDay, progress.dailyTarget, today);
  const missedYesterday =
    (countsByDay.get(formatDateKey(addDays(today, -1))) ?? 0) < progress.dailyTarget;

  const nextMilestone = MILESTONES.find((milestone) => milestone > solvedCount) ?? null;
  const remaining = NEETCODE_150_TOTAL - solvedCount;

  return {
    solvedCount,
    total: NEETCODE_150_TOTAL,
    percent: Math.round((solvedCount / NEETCODE_150_TOTAL) * 100),
    solvedToday,
    dailyTarget: progress.dailyTarget,
    metToday,
    streak,
    streakAtRisk: streak > 0 && !metToday && missedYesterday,
    unsolved,
    solvedByPattern,
    nextMilestone,
    toNextMilestone: nextMilestone ? nextMilestone - solvedCount : 0,
    projectedFinish:
      remaining > 0 ? addDays(today, Math.ceil(remaining / progress.dailyTarget)) : null,
  };
}
