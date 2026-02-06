import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  username: string;
  score: number;
}

interface LeaderboardProps {
  socket: Socket | null;
  sessionId: string;
  username: string;
}

export function Leaderboard({ socket, username }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: LeaderboardEntry[]) => {
      const sorted = [...data].sort((a, b) => b.score - a.score);
      setLeaderboard(sorted);
    };

    socket.on('leaderboard:update', handleUpdate);

    return () => {
      socket.off('leaderboard:update', handleUpdate);
    };
  }, [socket]);

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
           <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
           Live Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-2">
           {leaderboard.length === 0 && (
             <p className="text-sm text-slate-500 italic">Waiting for scores...</p>
           )}
           {leaderboard.map((entry, index) => {
             const isMe = entry.username === username;
             return (
               <div 
                 key={entry.username}
                 className={cn(
                   "flex items-center justify-between p-3 rounded-lg border transition-all",
                   isMe 
                     ? "bg-primary/10 border-primary/20 shadow-sm"
                     : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                 )}
               >
                 <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                     index === 0 ? "bg-yellow-100 text-yellow-700" :
                     index === 1 ? "bg-slate-200 text-slate-700" :
                     index === 2 ? "bg-orange-100 text-orange-700" :
                     "bg-transparent text-slate-500"
                   )}>
                     {index + 1}
                   </div>
                   <div className="flex flex-col">
                     <span className={cn(
                        "text-sm font-bold truncate max-w-[120px]",
                        isMe ? "text-primary" : "text-slate-900 dark:text-slate-100"
                     )}>
                       {entry.username} {isMe && "(You)"}
                     </span>
                   </div>
                 </div>
                 <span className="font-mono font-bold text-slate-900 dark:text-white">
                   {entry.score}
                 </span>
               </div>
             )
           })}
        </div>
      </CardContent>
    </Card>
  );
}
