import { useCallback, useEffect, useState } from 'react';

import { LocalEvent, loadLocalEvents, saveLocalEvents } from '@/services/local-events';

function generateId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useLocalEvents() {
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);

  useEffect(() => {
    loadLocalEvents().then(setLocalEvents);
  }, []);

  const addLocalEvent = useCallback((event: Omit<LocalEvent, 'id'>) => {
    const newEvent: LocalEvent = { ...event, id: generateId() };
    setLocalEvents((prev) => {
      const next = [...prev, newEvent];
      saveLocalEvents(next);
      return next;
    });
    return newEvent.id;
  }, []);

  const updateLocalEvent = useCallback((id: string, patch: Partial<Omit<LocalEvent, 'id'>>) => {
    setLocalEvents((prev) => {
      const next = prev.map((event) => (event.id === id ? { ...event, ...patch } : event));
      saveLocalEvents(next);
      return next;
    });
  }, []);

  const deleteLocalEvent = useCallback((id: string) => {
    setLocalEvents((prev) => {
      const next = prev.filter((event) => event.id !== id);
      saveLocalEvents(next);
      return next;
    });
  }, []);

  return { localEvents, addLocalEvent, updateLocalEvent, deleteLocalEvent };
}
