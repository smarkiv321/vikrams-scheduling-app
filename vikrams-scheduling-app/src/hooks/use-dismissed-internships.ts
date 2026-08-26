import { useCallback, useEffect, useState } from 'react';

import {
  loadDismissedInternshipIds,
  saveDismissedInternshipIds,
} from '@/services/dismissed-internships';

export function useDismissedInternships() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDismissedInternshipIds().then((ids) => setDismissedIds(new Set(ids)));
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(id);
      saveDismissedInternshipIds(Array.from(next));
      return next;
    });
  }, []);

  return { dismissedIds, dismiss };
}
