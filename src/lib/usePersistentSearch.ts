import { useCallback, useEffect, useState } from "react";

export function usePersistentSearch(key: string) {
  const storageKey = `operacao:filtro-busca:${key}`;
  const [search, setSearchState] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) ?? "";
    } catch {
      return "";
    }
  });

  const setSearch = useCallback((value: string) => {
    try {
      if (value) {
        window.localStorage.setItem(storageKey, value);
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // A busca continua funcionando mesmo quando o armazenamento está bloqueado.
    }
    setSearchState(value);
  }, [storageKey]);

  useEffect(() => {
    const sincronizar = (event: StorageEvent) => {
      if (event.key === storageKey) setSearchState(event.newValue ?? "");
    };
    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, [storageKey]);

  return [search, setSearch] as const;
}
