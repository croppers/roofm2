'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface AddressAutocompleteProps {
  onPlaceSelected: (coords: { lat: number; lng: number }, address: string) => void;
  extraButton?: React.ReactNode;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

function formatAddress(p: PhotonFeature['properties']): string {
  const parts: string[] = [];
  if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  else if (p.name) parts.push(p.name);
  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.postcode) parts.push(p.postcode);
  return parts.join(', ');
}

export default function AddressAutocomplete({ onPlaceSelected, extraButton }: AddressAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`
      );
      const data = await res.json();
      const features: PhotonFeature[] = data.features ?? [];
      setResults(features);
      setIsOpen(features.length > 0);
    } catch (err) {
      console.error('Geocoding error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 300);
  };

  const handleSelect = (feature: PhotonFeature) => {
    const label = formatAddress(feature.properties);
    setQuery(label);
    setIsOpen(false);
    setResults([]);
    const [lon, lat] = feature.geometry.coordinates;
    onPlaceSelected({ lat, lng: lon }, label);
  };

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchAddress(query);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search for an address..."
            className="input-field pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center"
          aria-label="Search"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
        {extraButton}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-[10000] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(f)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                {formatAddress(f.properties)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
