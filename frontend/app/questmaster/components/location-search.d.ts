import { FC } from 'react';

interface LocationSearchProps {
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;
}

declare const LocationSearch: FC<LocationSearchProps>;
export default LocationSearch; 