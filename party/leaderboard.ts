import type * as Party from 'partykit/server';

// Type for D1 database binding (provided by Cloudflare Workers runtime)
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

interface LeaderboardEntry {
  id: number;
  nickname: string;
  score: number;
  submitted_at: string;
}

// Mock data for local development (when D1 is not available)
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 1, nickname: 'ProGamer', score: 47, submitted_at: new Date().toISOString() },
  { id: 2, nickname: 'DiceKing', score: 42, submitted_at: new Date().toISOString() },
  { id: 3, nickname: 'LuckyRoller', score: 38, submitted_at: new Date().toISOString() },
  { id: 4, nickname: 'BluffMaster', score: 35, submitted_at: new Date().toISOString() },
  { id: 5, nickname: 'PerudoPro', score: 31, submitted_at: new Date().toISOString() },
  { id: 6, nickname: 'SharkSlayer', score: 28, submitted_at: new Date().toISOString() },
  { id: 7, nickname: 'GauntletHero', score: 25, submitted_at: new Date().toISOString() },
  { id: 8, nickname: 'DudoCaller', score: 22, submitted_at: new Date().toISOString() },
  { id: 9, nickname: 'CalzaKing', score: 19, submitted_at: new Date().toISOString() },
  { id: 10, nickname: 'Challenger', score: 15, submitted_at: new Date().toISOString() },
];

// In-memory storage for mock submissions during local dev session
const mockSubmissions: LeaderboardEntry[] = [];

// Validation constants
const MAX_SCORE = 1000;
const MIN_SCORE = 0;
const MAX_NICKNAME_LENGTH = 30;
const MIN_NICKNAME_LENGTH = 2;
const NICKNAME_REGEX = /^[a-zA-Z0-9\s]+$/;

export default class LeaderboardServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onRequest(request: Party.Request): Promise<Response> {
    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests FIRST (before any other checks)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // D1 database binding from environment
    const db = (this.room.env as Record<string, unknown>).gauntlet_leaderboard as D1Database | undefined;
    const useMock = !db;

    const url = new URL(request.url);
    const path = url.pathname;

    // Extract the route segment after the room ID (e.g., /parties/leaderboard/global/rank -> rank)
    // PartyKit URL structure: /parties/{party-name}/{room-id}/{route?}
    const pathParts = path.split('/').filter(Boolean);
    const route = pathParts.length > 3 ? pathParts.slice(3).join('/') : '';

    try {
      // GET /rank - Get player rank
      if (request.method === 'GET' && route === 'rank') {
        if (useMock) {
          return this.handleMockGetRank(url, corsHeaders);
        }
        return await this.handleGetRank(url, db!, corsHeaders);
      }

      // GET /near - Get nearby scores
      if (request.method === 'GET' && route === 'near') {
        if (useMock) {
          return this.handleMockGetNearby(url, corsHeaders);
        }
        return await this.handleGetNearby(url, db!, corsHeaders);
      }

      // GET /health - Health check
      if (request.method === 'GET' && route === 'health') {
        return this.jsonResponse({ status: 'ok', mock: useMock, timestamp: new Date().toISOString() }, 200, corsHeaders);
      }

      // POST / - Submit score (no route segment)
      if (request.method === 'POST' && route === '') {
        if (useMock) {
          return await this.handleMockSubmitScore(request, corsHeaders);
        }
        return await this.handleSubmitScore(request, db!, corsHeaders);
      }

      // GET / - Fetch top 100 (no route segment)
      if (request.method === 'GET' && route === '') {
        if (useMock) {
          return this.handleMockFetchLeaderboard(corsHeaders);
        }
        return await this.handleFetchLeaderboard(url, db!, corsHeaders);
      }

      return this.jsonResponse({ error: 'Not found', path, route }, 404, corsHeaders);
    } catch (error) {
      console.error('Leaderboard error:', error);
      return this.jsonResponse(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        500,
        corsHeaders
      );
    }
  }

  private async handleSubmitScore(
    request: Party.Request,
    db: D1Database,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    let body: { nickname?: string; score?: unknown };

    try {
      body = await request.json();
    } catch {
      return this.jsonResponse({ error: 'Invalid JSON' }, 400, corsHeaders);
    }

    const { nickname, score } = body;

    // Validate nickname
    if (!nickname || typeof nickname !== 'string') {
      return this.jsonResponse({ error: 'Nickname is required' }, 400, corsHeaders);
    }

    if (nickname.length < MIN_NICKNAME_LENGTH || nickname.length > MAX_NICKNAME_LENGTH) {
      return this.jsonResponse(
        { error: `Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters` },
        400,
        corsHeaders
      );
    }

    if (!NICKNAME_REGEX.test(nickname)) {
      return this.jsonResponse(
        { error: 'Nickname must contain only alphanumeric characters and spaces' },
        400,
        corsHeaders
      );
    }

    // Validate score
    if (typeof score !== 'number' || !Number.isInteger(score)) {
      return this.jsonResponse({ error: 'Score must be an integer' }, 400, corsHeaders);
    }

    if (score < MIN_SCORE || score > MAX_SCORE) {
      return this.jsonResponse({ error: `Score must be between ${MIN_SCORE} and ${MAX_SCORE}` }, 400, corsHeaders);
    }

    // Insert into database
    try {
      await db
        .prepare('INSERT INTO leaderboard (nickname, score) VALUES (?, ?)')
        .bind(nickname, score)
        .run();

      return this.jsonResponse({ success: true }, 201, corsHeaders);
    } catch (error) {
      console.error('Database insert error:', error);
      return this.jsonResponse({ error: 'Failed to submit score' }, 500, corsHeaders);
    }
  }

  private async handleFetchLeaderboard(
    url: URL,
    db: D1Database,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const cursor = url.searchParams.get('cursor');
    const limit = 100;

    try {
      let query = `
        SELECT id, nickname, score, submitted_at
        FROM leaderboard
        WHERE submitted_at >= date('now', 'start of day')
      `;

      const params: (string | number)[] = [];

      // Apply cursor for pagination
      if (cursor) {
        const [cursorScore, cursorId] = cursor.split(':');
        const scoreNum = parseInt(cursorScore, 10);
        const idNum = parseInt(cursorId, 10);

        if (!isNaN(scoreNum) && !isNaN(idNum)) {
          query += ` AND (score < ? OR (score = ? AND id > ?))`;
          params.push(scoreNum, scoreNum, idNum);
        }
      }

      query += ` ORDER BY score DESC, id ASC LIMIT ?`;
      params.push(limit + 1); // Fetch one extra to determine if there's a next page

      let statement = db.prepare(query);
      for (const param of params) {
        statement = statement.bind(param);
      }

      const result = await statement.all<LeaderboardEntry>();
      const items = result.results || [];

      // Check if there are more results
      let nextCursor: string | null = null;
      if (items.length > limit) {
        const lastItem = items[limit - 1];
        nextCursor = `${lastItem.score}:${lastItem.id}`;
        items.pop(); // Remove the extra item
      }

      return this.jsonResponse({ items, nextCursor }, 200, corsHeaders);
    } catch (error) {
      console.error('Database fetch error:', error);
      return this.jsonResponse({ error: 'Failed to fetch leaderboard' }, 500, corsHeaders);
    }
  }

  private async handleGetRank(
    url: URL,
    db: D1Database,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const scoreParam = url.searchParams.get('score');

    if (!scoreParam) {
      return this.jsonResponse({ error: 'Score parameter is required' }, 400, corsHeaders);
    }

    const score = parseInt(scoreParam, 10);
    if (isNaN(score)) {
      return this.jsonResponse({ error: 'Score must be a valid number' }, 400, corsHeaders);
    }

    try {
      const result = await db
        .prepare(
          `SELECT COUNT(*) + 1 as rank
           FROM leaderboard
           WHERE score > ?
           AND submitted_at >= date('now', 'start of day')`
        )
        .bind(score)
        .first<{ rank: number }>();

      const rank = result?.rank || 1;

      return this.jsonResponse({ rank }, 200, corsHeaders);
    } catch (error) {
      console.error('Database rank query error:', error);
      return this.jsonResponse({ error: 'Failed to get rank' }, 500, corsHeaders);
    }
  }

  private async handleGetNearby(
    url: URL,
    db: D1Database,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const scoreParam = url.searchParams.get('score');

    if (!scoreParam) {
      return this.jsonResponse({ error: 'Score parameter is required' }, 400, corsHeaders);
    }

    const score = parseInt(scoreParam, 10);
    if (isNaN(score)) {
      return this.jsonResponse({ error: 'Score must be a valid number' }, 400, corsHeaders);
    }

    try {
      // Get 3 scores above
      const aboveResult = await db
        .prepare(
          `SELECT id, nickname, score, submitted_at
           FROM leaderboard
           WHERE score > ?
           AND submitted_at >= date('now', 'start of day')
           ORDER BY score ASC, id ASC
           LIMIT 3`
        )
        .bind(score)
        .all<LeaderboardEntry>();

      const above = (aboveResult.results || []).reverse(); // Reverse to show highest first

      // Get 3 scores below
      const belowResult = await db
        .prepare(
          `SELECT id, nickname, score, submitted_at
           FROM leaderboard
           WHERE score < ?
           AND submitted_at >= date('now', 'start of day')
           ORDER BY score DESC, id ASC
           LIMIT 3`
        )
        .bind(score)
        .all<LeaderboardEntry>();

      const below = belowResult.results || [];

      return this.jsonResponse({ above, below }, 200, corsHeaders);
    } catch (error) {
      console.error('Database nearby query error:', error);
      return this.jsonResponse({ error: 'Failed to get nearby scores' }, 500, corsHeaders);
    }
  }

  // ==================== Mock handlers for local development ====================

  private async handleMockSubmitScore(
    request: Party.Request,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    let body: { nickname?: string; score?: unknown };

    try {
      body = await request.json();
    } catch {
      return this.jsonResponse({ error: 'Invalid JSON' }, 400, corsHeaders);
    }

    const { nickname, score } = body;

    // Validate nickname
    if (!nickname || typeof nickname !== 'string') {
      return this.jsonResponse({ error: 'Nickname is required' }, 400, corsHeaders);
    }

    if (nickname.length < MIN_NICKNAME_LENGTH || nickname.length > MAX_NICKNAME_LENGTH) {
      return this.jsonResponse(
        { error: `Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters` },
        400,
        corsHeaders
      );
    }

    if (!NICKNAME_REGEX.test(nickname)) {
      return this.jsonResponse(
        { error: 'Nickname must contain only alphanumeric characters and spaces' },
        400,
        corsHeaders
      );
    }

    // Validate score
    if (typeof score !== 'number' || !Number.isInteger(score)) {
      return this.jsonResponse({ error: 'Score must be an integer' }, 400, corsHeaders);
    }

    if (score < MIN_SCORE || score > MAX_SCORE) {
      return this.jsonResponse({ error: `Score must be between ${MIN_SCORE} and ${MAX_SCORE}` }, 400, corsHeaders);
    }

    // Add to mock submissions
    const newEntry: LeaderboardEntry = {
      id: Date.now(),
      nickname,
      score,
      submitted_at: new Date().toISOString(),
    };
    mockSubmissions.push(newEntry);

    console.log('[MOCK] Score submitted:', newEntry);
    return this.jsonResponse({ success: true, mock: true }, 201, corsHeaders);
  }

  private handleMockFetchLeaderboard(corsHeaders: Record<string, string>): Response {
    // Combine mock data with any submissions from this session
    const allEntries = [...MOCK_LEADERBOARD, ...mockSubmissions]
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    console.log('[MOCK] Fetching leaderboard, entries:', allEntries.length);
    return this.jsonResponse({ items: allEntries, nextCursor: null, mock: true }, 200, corsHeaders);
  }

  private handleMockGetRank(url: URL, corsHeaders: Record<string, string>): Response {
    const scoreParam = url.searchParams.get('score');

    if (!scoreParam) {
      return this.jsonResponse({ error: 'Score parameter is required' }, 400, corsHeaders);
    }

    const score = parseInt(scoreParam, 10);
    if (isNaN(score)) {
      return this.jsonResponse({ error: 'Score must be a valid number' }, 400, corsHeaders);
    }

    // Count how many scores are higher
    const allEntries = [...MOCK_LEADERBOARD, ...mockSubmissions];
    const rank = allEntries.filter((e) => e.score > score).length + 1;

    console.log('[MOCK] Get rank for score:', score, '-> rank:', rank);
    return this.jsonResponse({ rank, mock: true }, 200, corsHeaders);
  }

  private handleMockGetNearby(url: URL, corsHeaders: Record<string, string>): Response {
    const scoreParam = url.searchParams.get('score');

    if (!scoreParam) {
      return this.jsonResponse({ error: 'Score parameter is required' }, 400, corsHeaders);
    }

    const score = parseInt(scoreParam, 10);
    if (isNaN(score)) {
      return this.jsonResponse({ error: 'Score must be a valid number' }, 400, corsHeaders);
    }

    const allEntries = [...MOCK_LEADERBOARD, ...mockSubmissions].sort((a, b) => b.score - a.score);

    // Get 3 scores above (closest to player, in descending order)
    const above = allEntries.filter((e) => e.score > score).slice(-3);

    // Get 3 scores below
    const below = allEntries.filter((e) => e.score < score).slice(0, 3);

    console.log('[MOCK] Get nearby for score:', score, '-> above:', above.length, 'below:', below.length);
    return this.jsonResponse({ above, below, mock: true }, 200, corsHeaders);
  }

  // ==================== End mock handlers ====================

  private jsonResponse(data: unknown, status: number, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }
}
