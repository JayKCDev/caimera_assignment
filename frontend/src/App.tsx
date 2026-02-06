import { Header } from "@/components/dashboard/Header";
import { RightSidebar } from "@/components/dashboard/RightSidebar";
import { QuizArea } from "@/components/dashboard/QuizArea";
import { SessionModal } from '@/components/SessionModal';
import { WinnerAlert } from '@/components/WinnerAlert';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { GameProvider, useGame } from "@/context/GameContext";

function GameContent() {
  const { 
    session, 
  } = useGame();

  if (session.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session.sessionId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center mb-8">
           <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">MathSprint</h1>
           <p className="text-slate-500">Fast-paced competitive mental math</p>
        </div>

        <SessionModal 
          type="create" 
          isOpen={true} 
          onClose={() => {}}
        />
      </main>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <Header />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <QuizArea />
        <RightSidebar />
      </div>
      
      <WinnerAlert />
    </div>
  )
}

function App() {
  return (
    <GameProvider>
       <Toaster 
        position="top-center" 
        toastOptions={{
          success: { duration: 2000 },
          error: { duration: 5000 },
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <GameContent />
    </GameProvider>
  );
}

export default App
