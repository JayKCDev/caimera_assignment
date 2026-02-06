import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { setSocketInstance } from '@/lib/socketInstance';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket(sessionId: string | null): {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  latency: number | null;
} {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSocket(null);
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { sessionId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = s;
    setSocketInstance(s);
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      s.emit('join');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.io.on('reconnect_attempt', () => {
      setIsReconnecting(true);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
      setSocket(null);
      setIsConnected(false);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !isConnected) return;

    const interval = setInterval(() => {
      const start = Date.now();
      socketRef.current?.volatile.emit('ping', start);
    }, 5000);

    const socket = socketRef.current;
    const onPong = (timestamp: number) => {
        const now = Date.now();
        setLatency(now - timestamp);
    };

    socket?.on('pong', onPong);

    return () => {
        clearInterval(interval);
        socket?.off('pong', onPong);
    };
  }, [sessionId, isConnected]);

  return { socket, isConnected, isReconnecting, latency };
}
