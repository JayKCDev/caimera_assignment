import { QuestionDisplay } from "@/components/QuestionDisplay";
import { useGame } from "@/context/GameContext";

export function QuizArea() {
  const { currentQuestion: question } = useGame();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50 dark:bg-slate-950 overflow-y-auto w-full">
      {question ? (
        <QuestionDisplay />
      ) : (
        <div className="text-center p-12">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Waiting for next round...</h2>
          <p className="text-slate-500 mt-2">Get ready!</p>
        </div>
      )}
    </main>
  );
}
