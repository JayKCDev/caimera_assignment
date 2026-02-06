import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGame } from '@/context/GameContext';

type SubmissionResult = {
  correct: boolean;
  message: string;
} | null;

export function QuestionDisplay() {
  const { currentQuestion, socket, isOnline } = useGame();
  const question = currentQuestion!;

  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAnswer('');
    setSubmissionResult(null);
    setIsSubmitting(false);
    setHasSubmitted(false);
    
    if (isOnline) {
       setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [question.id, isOnline]);

  useEffect(() => {
    if (!socket) return;

    const handleResult = (data: {
      success?: boolean;
      error?: string;
      message?: string;
      isWinner?: boolean;
      newScore?: number;
    }) => {
      setIsSubmitting(false);
      const correct = data.success === true;

      if (correct) {
        setHasSubmitted(true);
      }

      const message =
        correct
          ? `Correct! +10 points${data.newScore != null ? ` (${data.newScore} total)` : ''}`
          : data.message ?? (data.error === 'TOO_LATE' ? 'Too late!' : data.error === 'WRONG_ANSWER' ? 'Incorrect Answer' : data.error ?? 'Error');
      setSubmissionResult({ correct, message });

      setTimeout(() => setSubmissionResult(null), 2000);
    };

    socket.on('answer:result', handleResult);

    return () => {
      socket.off('answer:result', handleResult);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting || !socket) return;

    setIsSubmitting(true);
    socket.emit('submit_answer', {
      questionId: question.id,
      answer: answer.trim(),
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="overflow-hidden shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center gap-8 p-12">
          
          <div className="text-center space-y-4">
            <p className="text-slate-500 font-medium italic">Solve for x:</p>
            <h3 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {question.problem}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
             <div className="relative">
                <Input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  placeholder={!isOnline ? "Waiting for connection..." : "x = ?"}
                  value={answer}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      setAnswer(val);
                      if (submissionResult?.correct === false) {
                        setSubmissionResult(null);
                      }
                    }
                  }}
                  disabled={isSubmitting || hasSubmitted || !isOnline}
                  className={cn(
                    "w-full text-center text-3xl font-bold py-6 h-auto transition-all",
                    submissionResult?.correct === true && "border-green-500 bg-green-50 text-green-700",
                    submissionResult?.correct === false && "border-red-500 bg-red-50 text-red-700",
                    !isOnline && "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                  autoComplete="off"
                />
             </div>
             
             {submissionResult && (
                <div className={cn(
                  "text-center font-bold text-lg animate-in fade-in slide-in-from-bottom-2",
                  submissionResult.correct ? "text-green-600" : "text-red-600"
                )}>
                  {submissionResult.message}
                </div>
             )}

             {(!submissionResult || !submissionResult.correct) && (
               <Button
                type="submit"
                className="w-full h-12 text-lg font-bold rounded-xl"
                disabled={!answer.trim() || isSubmitting || hasSubmitted || !isOnline}
               >
                 {!isOnline ? 'Offline' : isSubmitting ? 'Checking...' : 'Submit Answer'}
               </Button>
             )}
          </form>
        </div>
      </Card>
      
      <div className="mt-6 text-center text-slate-400 text-sm">
         Press <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-600 dark:text-slate-400 mx-1">Enter</kbd> to submit
      </div>
    </div>
  );
}
