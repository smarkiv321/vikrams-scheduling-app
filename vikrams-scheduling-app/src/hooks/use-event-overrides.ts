import { useCallback, useEffect, useState } from 'react';

import { EventOverride, loadOverrides, saveOverrides } from '@/services/event-overrides';

export function useEventOverrides() {
  const [overrides, setOverrides] = useState<Record<string, EventOverride>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadOverrides().then((loaded) => {
      setOverrides(loaded);
      setIsLoaded(true);
    });
  }, []);

  const setOverride = useCallback((id: string, patch: EventOverride) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveOverrides(next);
      return next;
    });
  }, []);

  const clearOverride = useCallback((id: string) => {
    setOverrides((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      saveOverrides(next);
      return next;
    });
  }, []);

  return { overrides, isLoaded, setOverride, clearOverride };
}
