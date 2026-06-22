interface LineaData {
  id: string;
  nombre: string;
  codigo: string;
  color: string;
  puntos: { latitude: number; longitude: number }[];
}

interface SegBus {
  tipo: 'bus';
  linea: { id: string; nombre: string; codigo: string; color: string; tarifa: number };
  embarque: { lat: number; lng: number };
  descenso: { lat: number; lng: number };
  puntosRuta: [number, number][];
  distanciaKm: number;
  tiempoMin: number;
}

interface SegWalk {
  tipo: 'caminata';
  desde: { lat: number; lng: number };
  hasta: { lat: number; lng: number };
  puntosRuta: [number, number][];
  distanciaMetros: number;
  tiempoMin: number;
}

export interface OpcionRuta {
  segmentos: (SegBus | SegWalk)[];
  tiempoTotalMin: number;
  tiempoEsperaMin: number;
  distanciaTotalKm: number;
  caminataMetros: number;
  transbordos: number;
  costoTotal: number;
}

/* ─── lines ─── */

let allLineas: LineaData[] = [];
let selectedId: string | null = null;

export function getLineas(): LineaData[] { return allLineas; }
export function setLineas(lineas: LineaData[]): void { allLineas = lineas; }
export function getSelectedId(): string | null { return selectedId; }
export function setSelectedId(id: string | null): void { selectedId = id; }

/* ─── route results ─── */

let routeOpciones: OpcionRuta[] = [];
let routeIdx: number = 0;

export function getOpciones(): OpcionRuta[] { return routeOpciones; }
export function setOpciones(data: OpcionRuta[]): void { routeOpciones = data; }
export function getRouteIdx(): number { return routeIdx; }
export function setRouteIdx(idx: number): void { routeIdx = idx; }
export function clearRuta(): void { routeOpciones = []; routeIdx = 0; }
