import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/hooks/useSession';
import { Loader2 } from 'lucide-react';

interface UsernamePromptProps {
  onSessionCreated: () => void;
}

export function UsernamePrompt({ onSessionCreated }: UsernamePromptProps) {
  const [username, setUsername] = useState('');
  const { createSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username cannot be empty');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and spaces');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await createSession(trimmed);
    if (result.success) {
      onSessionCreated();
    } else {
      const message = result.error ?? 'Failed to join session';
      setError(message);
      toast.error(message);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join the Quiz</CardTitle>
          <CardDescription>Enter your username to start competing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                }}
                disabled={isLoading}
                className={error ? 'border-red-500' : ''}
              />
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !username.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Start Sprint'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
