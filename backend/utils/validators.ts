const USERNAME_REGEX = /^[a-zA-Z0-9 ]{1,20}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUsername(username: string): boolean {
  if (typeof username !== 'string' || !username.trim()) return false;
  return USERNAME_REGEX.test(username.trim());
}

export function validateSessionId(sessionId: string): boolean {
  return typeof sessionId === 'string' && UUID_REGEX.test(sessionId);
}

export function validateAnswer(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}
