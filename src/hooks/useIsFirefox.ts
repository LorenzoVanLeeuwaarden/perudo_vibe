'use client';

import { useState, useEffect } from 'react';

export function useIsFirefox(): boolean {
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsFirefox(navigator.userAgent.toLowerCase().includes('firefox'));
    }
  }, []);

  return isFirefox;
}
