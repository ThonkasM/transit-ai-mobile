import { api } from './api';

export interface ResumenBilletera {
  address: string;
  categoria: string;
  saldoBs: number;
  saldoCentavos: number;
}

export interface Linea {
  id: string;
  name: string;
  code: string;
  fare: number | string;
  color: string;
}

export interface Movimiento {
  id: string;
  tipo: string;
  montoBs: number;
  tarifaBaseBs: number | null;
  descuentoBps: number | null;
  txHash: string | null;
  blockNumber: number | null;
  fecha: string;
}

export interface ResultadoRecarga {
  ok: boolean;
  recargaBs: number;
  saldoBs: number;
  txHash: string;
  blockNumber: number;
}

export interface ResultadoPago {
  ok: boolean;
  linea: string;
  tarifaBaseBs: number;
  descuentoBs: number;
  tarifaPagadaBs: number;
  categoria: string;
  saldoBs: number;
  txHash: string;
  blockNumber: number;
}

export interface ResultadoQr {
  qr: string;
  expiraEnSeg: number;
}

export interface ResultadoAbono {
  ok: boolean;
  paseId: string;
  linea: string;
  precioBs: number;
  validoHasta: string;
  txHash: string;
}

export interface EstadoAbono {
  activo: boolean;
  paseId?: string;
  lineId?: string;
  precioBs?: number;
  validoHasta?: string;
}

export const billeteraServicio = {
  miBilletera: () => api.get<ResumenBilletera>('/billetera'),

  crearBilletera: () => api.post<ResumenBilletera>('/billetera'),

  recargar: (body: { monto: number; metodo?: string; referencia?: string }) =>
    api.post<ResultadoRecarga>('/billetera/recargar', body),

  pagar: (body: { lineaId: string }) =>
    api.post<ResultadoPago>('/billetera/pagar', body),

  generarQr: () => api.get<ResultadoQr>('/billetera/qr'),

  comprarAbono: (body: { lineaId?: string }) =>
    api.post<ResultadoAbono>('/billetera/abono', body),

  abonoActivo: () => api.get<EstadoAbono>('/billetera/abono'),

  miHistorial: () => api.get<Movimiento[]>('/billetera/historial'),

  stripeCheckout: (body: { monto: number }) =>
    api.post<{ url: string }>('/billetera/stripe/checkout', body),

  stripeConfirmar: (body: { sessionId: string }) =>
    api.post('/billetera/stripe/confirmar', body),
};

export const lineasServicio = {
  obtenerTodas: () => api.get<Linea[]>('/lineas'),
};
