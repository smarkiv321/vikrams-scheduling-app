import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  computeStats,
  DAILY_TARGET_OPTIONS,
  DEFAULT_DAILY_TARGET,
  generateLogSlug,
  loadPracticeProgress,
  PracticeProgress,
  savePracticeProgress,
} from '@/services/practice-progress';
import { formatDateKey } from '@/utils/event-dates';

const INITIAL_PROGRESS: PracticeProgress = {
  version: 2,
  solved: [],
  dailyTarget: DEFAULT_DAILY_TARGET,
};

export function usePracticeProgress() {
  const [progress, setProgress] = useState<PracticeProgress>(INITIAL_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPracticeProgress().then((stored) => {
      setProgress(stored);
      setIsLoaded(true);
    });
  }, []);

  const mutate = useCallback((apply: (prev: PracticeProgress) => PracticeProgress) => {
    setProgress((prev) => {
      const next = apply(prev);
      savePracticeProgress(next);
      return next;
    });
  }, []);

  const markSolved = useCallback(
    (slug: string) => {
      mutate((prev) =>
        prev.solved.some((entry) => entry.slug === slug)
          ? prev
          : { ...prev, solved: [...prev.solved, { slug, solvedOn: formatDateKey(new Date()) }] }
      );
    },
    [mutate]
  );

  const unmarkSolved = useCallback(
    (slug: string) => {
      mutate((prev) => ({ ...prev, solved: prev.solved.filter((entry) => entry.slug !== slug) }));
    },
    [mutate]
  );

  const toggleSolved = useCallback(
    (slug: string) => {
      mutate((prev) =>
        prev.solved.some((entry) => entry.slug === slug)
          ? { ...prev, solved: prev.solved.filter((entry) => entry.slug !== slug) }
          : { ...prev, solved: [...prev.solved, { slug, solvedOn: formatDateKey(new Date()) }] }
      );
    },
    [mutate]
  );

  /** Undo a mis-tap — drops the most recently logged problem. */
  const undoLast = useCallback(() => {
    mutate((prev) => ({ ...prev, solved: prev.solved.slice(0, -1) }));
  }, [mutate]);

  /**
   * Free-text log entry for a problem outside the roadmap. Gets a synthetic
   * slug so it can never collide with — or be mistaken for — a real one.
   */
  const logProblem = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      mutate((prev) => ({
        ...prev,
        solved: [
          ...prev.solved,
          { slug: generateLogSlug(), title: trimmed, solvedOn: formatDateKey(new Date()) },
        ],
      }));
    },
    [mutate]
  );

  const cycleDailyTarget = useCallback(() => {
    mutate((prev) => {
      const index = DAILY_TARGET_OPTIONS.indexOf(prev.dailyTarget);
      return {
        ...prev,
        dailyTarget: DAILY_TARGET_OPTIONS[(index + 1) % DAILY_TARGET_OPTIONS.length],
      };
    });
  }, [mutate]);

  const stats = useMemo(() => computeStats(progress), [progress]);
  const solvedSlugs = useMemo(
    () => new Set(progress.solved.map((entry) => entry.slug)),
    [progress.solved]
  );
  const lastSolvedSlug = progress.solved.at(-1)?.slug ?? null;
  // Most recent first, so a freshly logged entry appears at the top.
  const logEntries = useMemo(
    () => progress.solved.filter((entry) => entry.title != null).reverse(),
    [progress.solved]
  );

  return {
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
  };
}
