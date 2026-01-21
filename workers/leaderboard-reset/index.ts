interface Env {
  LEADERBOARD_DB: D1Database;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('[CRON] Daily leaderboard reset triggered at', new Date().toISOString());

    const db = env.LEADERBOARD_DB;

    try {
      // Archive yesterday's top 10 (if history table exists)
      // This may fail if history table doesn't exist - that's OK for MVP
      try {
        await db.prepare(`
          INSERT INTO leaderboard_history (nickname, score, date, rank)
          SELECT
            nickname,
            score,
            date('now', '-1 day'),
            ROW_NUMBER() OVER (ORDER BY score DESC, id ASC)
          FROM leaderboard
          ORDER BY score DESC, id ASC
          LIMIT 10
        `).run();
        console.log('[CRON] Archived top 10 to history');
      } catch (archiveError) {
        // History table may not exist - continue with reset
        console.log('[CRON] Archive skipped (history table may not exist):', archiveError);
      }

      // Delete all entries from current leaderboard
      const result = await db.prepare('DELETE FROM leaderboard').run();

      console.log('[CRON] Reset complete. Deleted', result.meta.changes, 'entries');
    } catch (error) {
      console.error('[CRON] Reset failed:', error);
      throw error; // Re-throw to mark cron as failed in Cloudflare dashboard
    }
  },

  // Optional: HTTP handler for manual trigger/testing
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        worker: 'leaderboard-reset',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Manual trigger (protected - could add auth header check)
    if (url.pathname === '/trigger' && request.method === 'POST') {
      try {
        await this.scheduled({} as ScheduledController, env, {} as ExecutionContext);
        return new Response(JSON.stringify({ success: true, message: 'Reset triggered' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Leaderboard Reset Worker', { status: 200 });
  }
};
