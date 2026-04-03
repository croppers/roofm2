'use client';
import Image from "next/image";
import dynamic from 'next/dynamic';
import { useState } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import ThemeToggle from './ThemeToggle';
import { calculateAreaSqMeters } from '../utils/area';

const Map = dynamic(() => import('./Map'), { ssr: false });

export default function HomeContent() {
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });
  const [areaSqm, setAreaSqm] = useState<number | null>(null);

  const handlePlaceSelected = (coords: { lat: number; lng: number }) => {
    setCenter(coords);
  };

  const handlePolygonComplete = (coords: { lat: number; lng: number }[]) => {
    setAreaSqm(coords.length === 0 ? null : calculateAreaSqMeters(coords));
  };

  const sqm = areaSqm ?? 0;
  const sqft = sqm * 10.7639;
  const acres = sqm / 4046.86;

  return (
    <div className="flex flex-col h-screen overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="shrink-0 w-full bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Image
              src="/@roofm2_logo.svg"
              alt="Roofm²"
              width={576}
              height={174}
              priority
              className="h-8 sm:h-12 w-auto brightness-0 invert"
            />
            <ThemeToggle />
          </div>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            Measure Any Roof or Area from Satellite Imagery
          </p>
        </div>
      </header>

      {/* Main - fills remaining space */}
      <main className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6 py-3 gap-3">
          {/* Search */}
          <div className="shrink-0">
            <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
          </div>

          {/* Map - fills remaining space */}
          <div className="flex-1 min-h-0">
            <Map center={center} onPolygonComplete={handlePolygonComplete} />
          </div>

          {/* Area or Hint */}
          <div className="shrink-0">
            {areaSqm === null ? (
              <p className="text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500 py-1">
                Use the polygon tool on the map to outline your roof
              </p>
            ) : (
              <div className="card overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
                  {[
                    { value: sqft.toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'ft²' },
                    { value: sqm.toLocaleString(undefined, { maximumFractionDigits: 0 }), unit: 'm²' },
                    { value: acres.toLocaleString(undefined, { maximumFractionDigits: 3 }), unit: 'acres' },
                  ].map(({ value, unit }) => (
                    <div key={unit} className="py-3 sm:py-4 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">{unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Stephen Cropper
          </span>
          <a href="https://github.com/croppers/roofm2" target="_blank" rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
