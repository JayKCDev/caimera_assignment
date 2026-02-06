import { Leaderboard } from "@/components/Leaderboard";
import { useGame } from "@/context/GameContext";

export function RightSidebar() {
  const { session, socket } = useGame();
  const { sessionId, username } = session;

  return (
    <aside className="w-full lg:w-80 h-[350px] lg:h-auto border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-6 overflow-y-auto">
      <div className="flex-1">
        <Leaderboard socket={socket} sessionId={sessionId!} username={username!} />
      </div>
    </aside>
  )
}
