import { useCallback, useEffect, useState } from 'react';

import { loadHiddenCalendarIds, saveHiddenCalendarIds } from '@/services/hidden-calendars';

export function useHiddenCalendars() {
  const [hiddenCalendarIds, setHiddenCalendarIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHiddenCalendarIds().then((ids) => setHiddenCalendarIds(new Set(ids)));
  }, []);

  const toggleCalendarHidden = useCallback((id: string) => {
    setHiddenCalendarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveHiddenCalendarIds(Array.from(next));
      return next;
    });
  }, []);

  return { hiddenCalendarIds, toggleCalendarHidden };
}
