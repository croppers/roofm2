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
    if (coords.length === 0) {
      setAreaSqm(null);
      return;
    }
    setAreaSqm(calculateAreaSqMeters(coords));
  };

  const sqm = areaSqm ?? 0;
  const sqft = sqm * 10.7639;
  const acres = sqm / 4046.86;

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-700 dark:via-primary-600 dark:to-accent-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-6">
            <Image
              src="/@roofm2_logo.svg"
              alt="Roofm² Logo"
              width={576}
              height={174}
              priority
              className="h-8 sm:h-12 w-auto brightness-0 invert"
            />
            <ThemeToggle />
          </div>
          <p className="text-white/90 text-sm sm:text-base max-w-2xl leading-relaxed">
            Estimate your roof&apos;s area. Search for your address, draw your roof outline on the satellite map, and get instant measurements.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Address Search */}
          <div className="card p-6">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Find your property
            </label>
            <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
          </div>

          {/* Area Display */}
          {areaSqm !== null && (
            <div className="card p-6">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 text-center">
                Roof Area
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {sqm.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">m²</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {sqft.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ft²</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {acres.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">acres</p>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <Map center={center} onPolygonComplete={handlePolygonComplete} />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/@roofm2_logo.svg"
                alt="Roofm²"
                width={100}
                height={30}
                className="h-5 w-auto opacity-50 dark:invert dark:opacity-40"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                &copy; {new Date().getFullYear()} Stephen Cropper
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/croppers/roofm2" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://buymeacoffee.com/cropper" target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full font-medium transition-colors">
                Buy me a coffee
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
