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

  if (loadError) {
    return (
      <div className="card p-4 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">Failed to load address search</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please check your connection and refresh the page.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4 gap-3">
        <svg className="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-gray-500 dark:text-gray-400 text-sm">Loading address search...</span>
      </div>
    );
  }

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for an address..."
          className="input-field pl-11"
        />
      </div>
    </Autocomplete>
  );
}
