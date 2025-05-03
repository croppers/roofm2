'use client';
import { useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

interface AddressAutocompleteProps {
  onPlaceSelected: (coords: { lat: number; lng: number }, address: string) => void;
}

export default function AddressAutocomplete({ onPlaceSelected }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['drawing', 'places'],
  });

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formatted = place.formatted_address || '';
      onPlaceSelected({ lat, lng }, formatted);
    }
  };

  if (loadError) return <div>Error loading Places</div>;
  if (!isLoaded) return <div>Loading autocomplete...</div>;

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter address"
        className="w-full p-2 border rounded"
      />
    </Autocomplete>
  );
} 