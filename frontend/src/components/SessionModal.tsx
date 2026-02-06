import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGame } from '@/context/GameContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SessionModalProps {
  type: 'create' | 'reset';
  isOpen: boolean;
  onClose: () => void;
}

export function SessionModal({ type, isOpen, onClose }: SessionModalProps) {
  const { createSession, deleteSession } = useGame();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'create') {
      if (!username.trim() || username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      setIsLoading(true);
      setError('');

      try {
        const result = await createSession(username.trim());
        if (result && !result.success) {
             const message = result.error ?? 'Failed to create session';
             console.log('[SessionModal] createSession failed, showing toast:', message);
             setError(message);
             toast.error(message, {
               style: {
                 background: '#EF4444',
                 color: '#fff',
                 fontWeight: 'bold',
               },
             });
        } else {
            onClose();
        }
      } catch (err: any) {
        const msg = err?.message || 'Failed to create session';
        if (msg === 'USERNAME_TAKEN') {
             toast.error("Username already taken", {
                 style: {
                     background: '#EF4444',
                     color: '#fff',
                     fontWeight: 'bold'
                 }
             });
        } else {
             setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await deleteSession();
        onClose();
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && type === 'reset') {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {type === 'create' ? 'Welcome to MathSprint' : 'Reset Session?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {type === 'create' 
              ? 'Enter your name to join the competition.' 
              : 'Are you sure you want to exit? Your progress will be lost.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {type === 'create' && (
            <div className="space-y-2">
              <Input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="text-center text-lg"
                autoFocus
                maxLength={15}
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {type === 'reset' && (
               <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
                 Cancel
               </Button>
            )}
            <Button 
              type="submit" 
              className="w-full sm:w-auto" 
              disabled={isLoading || (type === 'create' && !username.trim())}
              variant={type === 'reset' ? 'destructive' : 'default'}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === 'create' ? 'Join Game' : 'Reset Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
