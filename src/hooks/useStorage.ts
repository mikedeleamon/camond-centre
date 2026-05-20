import { useState, useCallback } from "react";

export function useStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`camond:${key}`);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        try {
          localStorage.setItem(`camond:${key}`, JSON.stringify(resolved));
          window.electronAPI?.storage.set(key, resolved);
        } catch {
          // storage full or unavailable
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set] as const;
}
