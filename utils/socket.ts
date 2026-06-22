import { io, Socket } from 'socket.io-client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

let socketViajes: Socket | null = null;

export function obtenerSocketViajes(): Socket {
  if (!socketViajes?.connected) {
    socketViajes = io(`${BASE_URL}/viajes`, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socketViajes;
}

export function desconectarSocketViajes(): void {
  if (socketViajes) {
    socketViajes.disconnect();
    socketViajes = null;
  }
}
