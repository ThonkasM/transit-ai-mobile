import { createContext, useContext, useState, type ReactNode } from 'react';

interface MapContextType {
  selectedLineId: string | null;
  setSelectedLineId: (id: string | null) => void;
}

const MapContext = createContext<MapContextType>({
  selectedLineId: null,
  setSelectedLineId: () => {},
});

export function MapProvider({ children }: { children: ReactNode }) {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  return (
    <MapContext.Provider value={{ selectedLineId, setSelectedLineId }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  return useContext(MapContext);
}
