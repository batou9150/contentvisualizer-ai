import { useEffect, useState } from 'react';
import type { z } from 'zod';

/** useState persisted in localStorage, validated on read so stale or corrupt data can't crash the app. */
export function useStoredState<T>(key: string, schema: z.ZodType<T>, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = schema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or disabled: keep working in memory.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
