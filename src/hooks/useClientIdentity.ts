'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';

const CLIENT_ID_KEY = 'perudo-client-id';

/**
 * Hook for persistent client identity across sessions.
 * Generates a unique ID on first visit, stores in localStorage.
 * Returns null during SSR, then the stable ID after hydration.
 */
export function useClientIdentity(): string | null {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = nanoid(); // 21 chars, collision-proof
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    setClientId(id);
  }, []);

  return clientId;
}
