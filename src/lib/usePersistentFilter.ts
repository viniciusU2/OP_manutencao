import { useCallback, useState } from "react";

export const persistentFilterKey = (page: string, field: string) => `operacao:filtro:${page}:${field}`;

export function hasPersistentFilter(page: string, field: string) {
  try { return window.localStorage.getItem(persistentFilterKey(page, field)) !== null; }
  catch { return false; }
}

export function usePersistentFilter<T>(page: string, field: string, initialValue: T) {
  const storageKey = persistentFilterKey(page, field);
  const [value, setValueState] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored === null ? initialValue : JSON.parse(stored) as T;
    } catch { return initialValue; }
  });

  const setValue = useCallback((next: T | ((current: T) => T)) => {
    setValueState((current) => {
      const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      try { window.localStorage.setItem(storageKey, JSON.stringify(resolved)); } catch { /* mantém estado em memória */ }
      return resolved;
    });
  }, [storageKey]);

  return [value, setValue] as const;
}
