import { api } from './api';

export interface AsignacionHoy {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  internal: {
    internalNumber: string;
    licensePlate: string;
    model: string;
  };
  route: {
    id: string;
    name: string;
    direction: string;
    routeRecording?: {
      recordedPoints?: {
        type: string;
        coordinates: [number, number][];
      };
    };
  };
  shift: { name: string } | null;
  trips: { id: string; status: string }[];
}

export interface ResultadoViaje {
  id: string;
  status: string;
}

export interface ResultadoPagoQr {
  ok: boolean;
  linea?: string;
  tarifaPagadaBs?: number;
  saldoPasajeroBs?: number;
  txHash?: string;
  mensaje?: string;
}

export const choferServicio = {
  obtenerAsignacionHoy: () =>
    api.get<AsignacionHoy | null>('/asignaciones/mi-asignacion-hoy'),

  iniciarViaje: (asignacionId: string) =>
    api.post<ResultadoViaje>('/viajes/iniciar', { asignacionId }),

  finalizarViaje: (viajeId: string, razonFin?: string, velocidadPromedio?: number) =>
    api.patch<ResultadoViaje>(`/viajes/${viajeId}/finalizar`, {
      razonFin,
      velocidadPromedio,
    }),

  pagarQr: (qr: string, lineaId: string) =>
    api.post<ResultadoPagoQr>('/billetera/pagar-qr', { qr, lineaId }),
};
