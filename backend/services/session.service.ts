import { randomUUID } from 'crypto';
import { redis } from './redis.service';
import { validateUsername, validateSessionId } from '../utils/validators';

const SESSION_TTL = 86400;
const SESSION_PREFIX = 'session:';
const USERNAME_INDEX = 'username:index';
const LEADERBOARD_KEY = 'leaderboard';

export interface CreateSessionResult {
  sessionId: string;
  username: string;
}

export interface SessionData {
  username: string;
  createdAt: string;
  score: string;
}

export type CreateSessionError = 'USERNAME_TAKEN' | 'INVALID_USERNAME';

export async function createSession(
  username: string
): Promise<CreateSessionResult | { error: CreateSessionError }> {
  if (!validateUsername(username)) {
    return { error: 'INVALID_USERNAME' };
  }

  const trimmed = username.trim();
  const normalizedUsername = trimmed.toLowerCase();

  const added = await redis.sadd(USERNAME_INDEX, normalizedUsername);
  if (added === 0) {
    return { error: 'USERNAME_TAKEN' };
  }

  const sessionId = randomUUID();
  const now = Date.now().toString();

  await redis
    .multi()
    .hset(SESSION_PREFIX + sessionId, {
      username: trimmed,
      createdAt: now,
      score: '0',
    })
    .expire(SESSION_PREFIX + sessionId, SESSION_TTL)
    .exec();

  return { sessionId, username: trimmed };
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!validateSessionId(sessionId)) return null;

  const data = await redis.hgetall(SESSION_PREFIX + sessionId);
  if (!data || Object.keys(data).length === 0) return null;

  return data as unknown as SessionData;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  if (!validateSessionId(sessionId)) return false;

  const session = await getSession(sessionId);
  if (!session) return false;

  const normalizedUsername = session.username.toLowerCase();

  await redis
    .multi()
    .del(SESSION_PREFIX + sessionId)
    .srem(USERNAME_INDEX, normalizedUsername)
    .zrem(LEADERBOARD_KEY, sessionId)
    .exec();

  return true;
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  if (!validateSessionId(sessionId)) return;

  const key = SESSION_PREFIX + sessionId;
  const exists = await redis.exists(key);
  if (exists === 0) return;

  await redis
    .multi()
    .hset(key, 'lastActive', Date.now().toString())
    .expire(key, SESSION_TTL)
    .exec();
}
