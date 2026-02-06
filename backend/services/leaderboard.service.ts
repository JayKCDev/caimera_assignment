import { redis } from './redis.service';
import { getSession } from './session.service';

const LEADERBOARD_KEY = 'leaderboard';

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export interface UserRank {
  score: number;
  rank: number;
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const results = await redis.zrevrange(LEADERBOARD_KEY, 0, limit - 1, 'WITHSCORES');

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < results.length; i += 2) {
    const sessionId = results[i];
    const score = parseFloat(results[i + 1]);
    const session = await getSession(sessionId);
    entries.push({
      username: session?.username ?? 'Unknown User',
      score,
    });
  }

  return entries;
}

export async function getUserRank(sessionId: string): Promise<UserRank | null> {
  const [scoreStr, rank] = await Promise.all([
    redis.zscore(LEADERBOARD_KEY, sessionId),
    redis.zrevrank(LEADERBOARD_KEY, sessionId),
  ]);

  if (scoreStr === null || rank === null) return null;

  return {
    score: parseFloat(scoreStr),
    rank: rank + 1,
  };
}
