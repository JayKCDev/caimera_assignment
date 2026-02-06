import type { Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function setSocketInstance(socket: Socket | null): void {
  socketInstance = socket;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
