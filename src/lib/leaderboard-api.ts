// Frontend API client for leaderboard operations

// Use NEXT_PUBLIC env var for PartyKit host
const getLeaderboardUrl = () => {
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/parties/leaderboard/global`;
};

export interface LeaderboardEntry {
  id: number;
  nickname: string;
  score: number;
  submitted_at: string;
}

export interface LeaderboardResponse {
  items: LeaderboardEntry[];
  nextCursor: string | null;
}

export interface NearbyScoresResponse {
  above: LeaderboardEntry[];
  below: LeaderboardEntry[];
}

/**
 * Fetch top 100 leaderboard entries with optional cursor pagination
 * @param cursor - Optional cursor for pagination (format: "score:id")
 * @returns Leaderboard entries and next cursor
 */
export async function fetchLeaderboard(cursor?: string): Promise<LeaderboardResponse> {
  const url = new URL(getLeaderboardUrl());
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch leaderboard: ${errorText}`);
  }

  return response.json();
}

/**
 * Submit a score to the leaderboard
 * @param nickname - Player nickname (2-30 characters, alphanumeric + spaces)
 * @param score - Player score (0-1000)
 */
export async function submitScore(nickname: string, score: number): Promise<void> {
  // Client-side validation
  const MIN_NICKNAME_LENGTH = 2;
  const MAX_NICKNAME_LENGTH = 30;
  const NICKNAME_REGEX = /^[a-zA-Z0-9\s]+$/;

  if (nickname.length < MIN_NICKNAME_LENGTH || nickname.length > MAX_NICKNAME_LENGTH) {
    throw new Error(`Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters`);
  }

  if (!NICKNAME_REGEX.test(nickname)) {
    throw new Error('Nickname must contain only alphanumeric characters and spaces');
  }

  const url = getLeaderboardUrl();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname, score }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit score: ${errorText}`);
  }
}

/**
 * Get player rank for a given score
 * @param score - Player score
 * @returns Player rank (1-based)
 */
export async function getPlayerRank(score: number): Promise<number> {
  const url = new URL(`${getLeaderboardUrl()}/rank`);
  url.searchParams.set('score', score.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get rank: ${errorText}`);
  }

  const data = await response.json();
  return data.rank;
}

/**
 * Get nearby scores (3 above and 3 below)
 * @param score - Player score
 * @returns Nearby scores above and below
 */
export async function getNearbyScores(score: number): Promise<NearbyScoresResponse> {
  const url = new URL(`${getLeaderboardUrl()}/near`);
  url.searchParams.set('score', score.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get nearby scores: ${errorText}`);
  }

  return response.json();
}
