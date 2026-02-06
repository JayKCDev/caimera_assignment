import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGame } from '@/context/GameContext';

interface WinnerData {
  username: string;
  sessionId: string;
  newScore: number;
}

export function WinnerAlert() {
  const { session, socket } = useGame();
  const username = session.username!;
  
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleWinner = (data: WinnerData) => {
      setWinner(data);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
        setWinner(null);
      }, 3000);
    };

    socket.on('winner:announced', handleWinner);

    return () => {
      socket.off('winner:announced', handleWinner);
    };
  }, [socket]);

  if (!isVisible || !winner) return null;

  const isMe = winner.username === username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={cn(
        "max-w-md w-full p-8 rounded-2xl shadow-2xl transform transition-all scale-100 animate-in zoom-in-95",
        isMe ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      )}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">
            {isMe ? '🏆' : '👏'}
          </div>
          <h2 className={cn(
            "text-3xl font-black uppercase tracking-tight",
            isMe ? "text-white" : "text-slate-900 dark:text-white"
          )}>
            {isMe ? 'You Won!' : 'Winner Announced!'}
          </h2>
          
          <div className="py-4">
            <p className={cn(
              "text-xl font-bold",
              isMe ? "text-white/90" : "text-primary"
            )}>
              {winner.username}
            </p>
            <p className={cn(
              "text-sm font-medium mt-1",
              isMe ? "text-white/80" : "text-slate-500"
            )}>
              Score: {winner.newScore}
            </p>
          </div>

          {!isMe && (
            <p className="text-slate-500 text-sm">Better luck next round!</p>
          )}
        </div>
      </div>
    </div>
  );
}
