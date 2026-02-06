import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { useSession } from '@/hooks/useSession';
import { useSocket } from '@/hooks/useSocket';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface GameContextType {
  session: ReturnType<typeof useSession>['session'];
  createSession: ReturnType<typeof useSession>['createSession'];
  deleteSession: ReturnType<typeof useSession>['deleteSession'];
  loadSession: ReturnType<typeof useSession>['loadSession'];

  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  latency: number | null;

  isOnline: boolean;

  currentQuestion: { id: string; problem: string } | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { session, createSession, loadSession, deleteSession } = useSession();
  const { socket, isConnected, isReconnecting, latency } = useSocket(session.sessionId);
  const { isOnline } = useNetworkStatus(isConnected);
  const [currentQuestion, setCurrentQuestion] = useState<{ id: string; problem: string } | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleQuestion = (q: { id: string; problem: string }) => {
      setCurrentQuestion(q);
    };

    socket.on('question:current', handleQuestion);
    socket.on('question:new', handleQuestion);

    return () => {
      socket.off('question:current', handleQuestion);
      socket.off('question:new', handleQuestion);
    };
  }, [socket]);

  const handleLogout = async () => {
      await deleteSession();
      setCurrentQuestion(null);
  };

  const value = {
    session,
    createSession,
    deleteSession: handleLogout, 
    loadSession,
    
    socket,
    isConnected,
    isReconnecting,
    latency,
    
    isOnline,
    
    currentQuestion
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
