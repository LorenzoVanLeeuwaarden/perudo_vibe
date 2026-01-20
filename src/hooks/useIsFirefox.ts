'use client';

import { useMemo } from 'react';

export function useIsFirefox(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  }, []);
}
