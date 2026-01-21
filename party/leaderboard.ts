import type * as Party from 'partykit/server';

export default class LeaderboardServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onRequest(request: Party.Request): Promise<Response> {
    // D1 database binding will be available via room.env after wrangler.jsonc configuration
    // Type assertion for D1Database (provided by Cloudflare Workers runtime)
    const db = (this.room.env as Record<string, unknown>).LEADERBOARD_DB as unknown;

    // Route based on method + path
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (request.method === 'GET' && path.endsWith('/health')) {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Placeholder for future endpoints (Plan 03 will implement GET /scores, POST /submit)
    return new Response('Leaderboard API', { status: 200 });
  }
}
