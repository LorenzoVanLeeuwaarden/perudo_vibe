import { useState, useEffect } from 'react';

/**
 * Hook that returns a countdown string to midnight UTC
 * Updates every second
 * @returns Formatted countdown string (e.g., "5h 23m 42s")
 */
export function useCountdownToMidnight(): string {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const midnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}
