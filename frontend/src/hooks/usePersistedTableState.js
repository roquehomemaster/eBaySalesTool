// usePersistedTableState.js
// Hook to persist table filter & sort state per pageKey + table id in localStorage.
import { useEffect, useRef, useState } from 'react';

export default function usePersistedTableState(storageKey, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...initial, ...parsed };
      }
    } catch (_) {}
    return initial;
  });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try { window.localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) {}
  }, [state, storageKey]);
  return [state, setState];
}
