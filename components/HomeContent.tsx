'use client';
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Map from './Map';
import AddressAutocomplete from './AddressAutocomplete';
import UnitToggle from './UnitToggle';
import ThemeToggle from './ThemeToggle';
import ReportDownload from './ReportDownload';
import { calculateAreaSqMeters, getPolygonCentroid } from '../utils/area';
import { roundDecimal } from '../utils/unitConversion';
import html2canvas from 'html2canvas';

export default function HomeContent() {
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: 37.7749, lng: -122.4194 });
  const [address, setAddress] = useState<string>('');
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [areaSqm, setAreaSqm] = useState<number | null>(null);
  const [formattedArea, setFormattedArea] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const units = searchParams?.get('units') === 'imperial' ? 'imperial' : 'metric';

  const [monthlySolar, setMonthlySolar] = useState<Record<string, number>>({});
  const [monthlyPrecip, setMonthlyPrecip] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mapImageDataUrl, setMapImageDataUrl] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (areaSqm === null) {
      setFormattedArea('');
      return;
    }
    if (units === 'imperial') {
      const areaFt = areaSqm * 10.7639;
      setFormattedArea(`${areaFt.toLocaleString(undefined, {maximumFractionDigits: 1})} ft²`);
    } else {
      setFormattedArea(`${areaSqm.toLocaleString(undefined, {maximumFractionDigits: 1})} m²`);
    }
  }, [areaSqm, units]);

  const handlePlaceSelected = (coords: { lat: number; lng: number }, addr: string) => {
    setCenter(coords);
    setAddress(addr);
    setError(null);
  };

  const handlePolygonComplete = async (polygon: google.maps.Polygon, coords: google.maps.LatLngLiteral[]) => {
    polygons.forEach(p => p.setMap(null));
    setPolygons([polygon]);
    const sqm = calculateAreaSqMeters(coords);
    setAreaSqm(roundDecimal(sqm));
    setIsLoading(true);
    setError(null);
    setMapImageDataUrl(null);
    const centerCoord = getPolygonCentroid(coords);

    setTimeout(async () => {
      if (mapContainerRef.current) {
        try {
          const canvas = await html2canvas(mapContainerRef.current, {
            useCORS: true,
            allowTaint: true,
          });
          setMapImageDataUrl(canvas.toDataURL('image/png'));
        } catch (e) {
          console.error("Error capturing map image:", e);
        }
      }
    }, 500);

    try {
      const res = await fetch(`/api/climate?lat=${centerCoord.lat}&lng=${centerCoord.lng}`);
      if (!res.ok) throw new Error('Climate data unavailable');
      const data = await res.json();
      setMonthlySolar(data.solar || {});
      setMonthlyPrecip(data.precipitation || {});
    } catch (e) {
      console.error('Climatology fetch error', e);
      setError('Unable to fetch climate data for this location. Please try again.');
      setMonthlySolar({});
      setMonthlyPrecip({});
    } finally {
      setIsLoading(false);
    }
  };

  const clearPolygons = () => {
    polygons.forEach(p => p.setMap(null));
    setPolygons([]);
    setAreaSqm(null);
    setMapImageDataUrl(null);
    setMonthlySolar({});
    setMonthlyPrecip({});
    setIsLoading(false);
    setError(null);
  };

  const hasData = areaSqm != null &&
                  Object.keys(monthlySolar).length > 0 &&
                  Object.keys(monthlyPrecip).length > 0;

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
            Estimate your roof area and analyze monthly solar radiation and precipitation.
            Draw your roof outline on the map and get an interactive report with energy and water capture projections.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Address Search Card */}
          <div className="card p-6">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Find your property
            </label>
            <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
          </div>

          {/* Controls Row */}
          {areaSqm !== null && (
            <div className="card p-4">
              <div className="flex items-center justify-between gap-4">
                <button onClick={clearPolygons} className="btn-danger text-xs sm:text-sm">
                  Clear
                </button>
                <div className="text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Roof Area</span>
                  <p className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-100">{formattedArea}</p>
                </div>
                <UnitToggle />
              </div>
            </div>
          )}

          {/* Map */}
          <div ref={mapContainerRef}>
            <Map center={center} onPolygonComplete={handlePolygonComplete} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && areaSqm != null && (
            <div className="card p-8 flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-primary-500 mb-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Fetching climate data...</p>
            </div>
          )}

          {/* Report */}
          {!isLoading && hasData && (
            <ReportDownload
              address={address}
              areaSqm={areaSqm!}
              monthlySolar={monthlySolar}
              monthlyPrecip={monthlyPrecip}
              mapImageDataUrl={mapImageDataUrl}
            />
          )}
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
              <a
                href="https://github.com/croppers/roofm2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://buymeacoffee.com/cropper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full font-medium transition-colors"
              >
                Buy me a coffee
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
