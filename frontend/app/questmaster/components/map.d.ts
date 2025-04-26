import { FC } from 'react';

interface MapProps {
  selectedLocation: { lat: number; lng: number } | null;
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;
}

declare const Map: FC<MapProps>;
export default Map; 