import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/GameContext";
import { SessionModal } from "@/components/SessionModal";

interface HeaderProps {
  onLogout?: () => void; 
}

export function Header({ onLogout }: HeaderProps) {
  const { session } = useGame();
  const username = session.username;
  const [showResetModal, setShowResetModal] = useState(false);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    setShowResetModal(true);
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-primary size-8">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">MathSprint</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
        </nav>
        <div className="flex items-center gap-4">
          {username ? (
            <>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{username}</span>
              <Button variant="outline" size="sm" onClick={handleLogoutClick} className="text-xs h-8">
                Reset Session
              </Button>
            </>
          ) : (
               <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Guest</span>
          )}
        </div>
      </header>

      <SessionModal 
        type="reset" 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
      />
    </>
  )
}
