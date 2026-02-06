import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

export function useNetworkStatus(isSocketConnected: boolean) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const offlineToastIdRef = useRef<string | undefined>(undefined);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/network.worker.ts', import.meta.url), {
      type: 'module'
    });

    workerRef.current.onmessage = (event: MessageEvent) => {
      const status = event.data;
      if (status === 'online') {
        setIsOnline((prev) => {
          if (!prev) {
             if (offlineToastIdRef.current) {
                toast.dismiss(offlineToastIdRef.current);
                offlineToastIdRef.current = undefined;
             }
             toast.success("Connection restored", {
                duration: 3000,
                icon: "🟢",
                id: 'network-restored'
             });
          }
          return true;
        });

      } else if (status === 'offline') {
        setIsOnline((prev) => {
          if (prev) {
             if (!offlineToastIdRef.current) {
                offlineToastIdRef.current = toast.error("No internet connection", {
                  duration: Infinity, 
                  icon: "🔴",
                  id: 'network-offline' 
                });
             }
          }
          return false;
        });
      }
    };

    return () => {
      workerRef.current?.terminate();
      if (offlineToastIdRef.current) {
        toast.dismiss(offlineToastIdRef.current);
      }
    };
  }, []);

  return { isOnline, isSocketConnected };
}
