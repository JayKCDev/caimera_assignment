import { useState, useCallback, useEffect } from 'react';
import { apiUrl } from '@/lib/api';
import { disconnectSocket } from '@/lib/socketInstance';

const STORAGE_SESSION_ID = 'math_quiz_session_id';
const STORAGE_USERNAME = 'math_quiz_username';

export interface SessionState {
  sessionId: string | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useSession(): {
  session: SessionState;
  createSession: (username: string) => Promise<{ success: boolean; error?: string }>;
  loadSession: () => Promise<void>;
  deleteSession: () => Promise<void>;
  clearError: () => void;
} {
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    username: null,
    isLoading: true,
    error: null,
  });

  const clearError = useCallback(() => {
    setSession((s) => ({ ...s, error: null }));
  }, []);

  const createSession = useCallback(async (username: string) => {
    setSession((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const res = await fetch(apiUrl('/api/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();

      if (data.error === 'USERNAME_TAKEN') {
        console.log('[useSession] Received USERNAME_TAKEN, message:', data.message);
        const message = data.message ?? 'Username already taken';
        setSession((s) => ({ ...s, isLoading: false, error: message }));
        return { success: false, error: message };
      }

      if (data.error) {
        const message = data.message ?? data.error ?? 'Failed to create session';
        setSession((s) => ({ ...s, isLoading: false, error: message }));
        return { success: false, error: message };
      }

      const { sessionId, username: savedUsername } = data;
      localStorage.setItem(STORAGE_SESSION_ID, sessionId);
      localStorage.setItem(STORAGE_USERNAME, savedUsername);

      setSession({
        sessionId,
        username: savedUsername,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setSession((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, []);

  const loadSession = useCallback(async () => {
    const sessionId = localStorage.getItem(STORAGE_SESSION_ID);
    if (!sessionId) {
      setSession((s) => ({ ...s, isLoading: false }));
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/session/${sessionId}`));
      if (!res.ok) {
        localStorage.removeItem(STORAGE_SESSION_ID);
        localStorage.removeItem(STORAGE_USERNAME);
        setSession({
          sessionId: null,
          username: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const data = await res.json();
      const username = localStorage.getItem(STORAGE_USERNAME) ?? data.username;

      setSession({
        sessionId,
        username,
        isLoading: false,
        error: null,
      });
    } catch {
      localStorage.removeItem(STORAGE_SESSION_ID);
      localStorage.removeItem(STORAGE_USERNAME);
      setSession({
        sessionId: null,
        username: null,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const deleteSession = useCallback(async () => {
    const sessionId = session.sessionId;
    if (!sessionId) {
      localStorage.removeItem(STORAGE_SESSION_ID);
      localStorage.removeItem(STORAGE_USERNAME);
      setSession({
        sessionId: null,
        username: null,
        isLoading: false,
        error: null,
      });
      disconnectSocket();
      return;
    }

    try {
      await fetch(apiUrl(`/api/session/${sessionId}`), {
        method: 'DELETE',
      });
    } finally {
      localStorage.removeItem(STORAGE_SESSION_ID);
      localStorage.removeItem(STORAGE_USERNAME);
      setSession({
        sessionId: null,
        username: null,
        isLoading: false,
        error: null,
      });
      disconnectSocket();
    }
  }, [session.sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    session,
    createSession,
    loadSession,
    deleteSession,
    clearError,
  };
}
