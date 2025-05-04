'use client';
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Map from './Map';
import AddressAutocomplete from './AddressAutocomplete';
import UnitToggle from './UnitToggle';
import ReportDownload from './ReportDownload';
import { calculateAreaSqMeters, getPolygonCentroid } from '../utils/area';
import { roundDecimal } from '../utils/unitConversion';
import html2canvas from 'html2canvas';

export default function HomeContent() {
  // Map center and selected address
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: 37.7749, lng: -122.4194 });
  const [address, setAddress] = useState<string>('');
  
  // Polygons and area
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [areaSqm, setAreaSqm] = useState<number | null>(null);
  
  // Formatted area with units
  const [formattedArea, setFormattedArea] = useState<string>('');
  
  // Get units from URL
  const searchParams = useSearchParams();
  const units = searchParams?.get('units') === 'imperial' ? 'imperial' : 'metric';
  
  // Climatology data
  const [monthlySolar, setMonthlySolar] = useState<Record<string, number>>({});
  const [monthlyPrecip, setMonthlyPrecip] = useState<Record<string, number>>({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mapImageDataUrl, setMapImageDataUrl] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Format the area display based on selected units
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
  };
  
  const handlePolygonComplete = async (polygon: google.maps.Polygon, coords: google.maps.LatLngLiteral[]) => {
    polygons.forEach(p => p.setMap(null));
    setPolygons([polygon]);
    const sqm = calculateAreaSqMeters(coords);
    setAreaSqm(roundDecimal(sqm));
    setIsLoading(true);
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
          setMapImageDataUrl(null);
        }
      }
    }, 500);

    try {
      const res = await fetch(`/api/climate?lat=${centerCoord.lat}&lng=${centerCoord.lng}`);
      const data = await res.json();
      setMonthlySolar(data.solar || {});
      setMonthlyPrecip(data.precipitation || {});
    } catch (e) {
      console.error('Climatology fetch error', e);
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
  };
  
  const hasData = areaSqm != null && 
                  Object.keys(monthlySolar).length > 0 && 
                  Object.keys(monthlyPrecip).length > 0;

  return (
    <div className="flex flex-col min-h-screen container mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-x-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="flex-1 flex flex-col items-center sm:items-start w-full">
        {/* Logo */}
        <div className="w-full flex justify-center mb-8">
          <Image
            src="/@roofm2_logo.svg"
            alt="Roofm² Logo"
            width={576}
            height={174}
            priority
            className="h-12 sm:h-20 max-w-full"
          />
        </div>
        {/* Description */}
        <div className="w-3/4 mx-auto mb-6 text-center text-gray-700">
          <p>
            Roofm² makes it easy to estimate your roof&apos;s area and analyze monthly solar radiation and precipitation at your home. Search for your address, draw your roof outline on the map, and view interactive charts of energy and water capture. Download a detailed PDF report when you&apos;re ready.
          </p>
        </div>
        {/* Grouped Address, Controls, and Map with uniform spacing */}
        <div className="w-full space-y-[3rem]">
          {/* Address Input */}
          <div className="w-3/4 mx-auto">
            <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
          </div>
          {/* Controls Row - show only after polygon drawn */}
          {areaSqm !== null && (
            <div className="w-3/4 mx-auto">
              <div className="grid grid-cols-3 items-center">
                {/* Clear Polygons button on left */}
                <div className="flex justify-start">
                  <button
                    onClick={clearPolygons}
                    className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm font-medium"
                  >
                    Clear Polygons
                  </button>
                </div>
                {/* Area text centered */}
                <div className="text-center font-semibold text-base sm:text-lg text-gray-700">
                  {formattedArea}
                </div>
                {/* Unit toggle on right */}
                <div className="flex justify-end">
                  <UnitToggle />
                </div>
              </div>
            </div>
          )}
          {/* Map Container */}
          <div ref={mapContainerRef} className="w-3/4 mx-auto" style={{ aspectRatio: '1/1' }}>
            <Map center={center} onPolygonComplete={handlePolygonComplete} />
          </div>
        </div>

        {/* Loading - Back in normal flow */}
        {isLoading && areaSqm != null && (
          <div className="w-full text-center py-4">
            <p className="text-lg sm:text-xl">Loading...</p>
          </div>
        )}

        {/* Report - add spacing above charts */}
        {!isLoading && hasData && (
          <div className="w-full mt-[3rem]">
            <ReportDownload
              address={address}
              areaSqm={areaSqm}
              monthlySolar={monthlySolar}
              monthlyPrecip={monthlyPrecip}
              mapImageDataUrl={mapImageDataUrl}
            />
          </div>
        )}
      </main>
      <footer className="w-full bg-gray-50 text-gray-600 py-8 mt-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <p className="text-center text-sm">© {new Date().getFullYear()} Stephen Cropper • <a href="https://buymeacoffee.com/cropper" target="_blank" rel="noopener noreferrer" className="inline-block ml-2 px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500">☕</a></p>
        </div>
      </footer>
    </div>
  );
} 