const STORAGE_KEY = 'gauntlet_personal_best';

export interface PersonalBest {
  score: number;
  date: string;
  nickname: string;
}

export function getPersonalBest(): PersonalBest | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function updatePersonalBest(score: number, nickname?: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getPersonalBest();

  if (!current || score > current.score) {
    const newBest: PersonalBest = {
      score,
      date: new Date().toISOString(),
      nickname: nickname || current?.nickname || 'Player'
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBest));
      return true; // New record
    } catch {
      return false;
    }
  }
  return false; // Not a new record
}

export function clearPersonalBest(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
