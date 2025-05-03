'use client';
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Map from './Map';
import AddressAutocomplete from './AddressAutocomplete';
import UnitToggle from './UnitToggle';
import ReportDownload from './ReportDownload';
import { calculateAreaSqMeters, getPolygonCentroid } from '../utils/area';
import { roundDecimal } from '../utils/unitConversion';

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
    const centerCoord = getPolygonCentroid(coords);
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
    setMonthlySolar({});
    setMonthlyPrecip({});
    setIsLoading(false);
  };
  
  const hasData = areaSqm != null && 
                  Object.keys(monthlySolar).length > 0 && 
                  Object.keys(monthlyPrecip).length > 0;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen px-4 sm:px-8 py-6 sm:p-8 md:p-20 gap-8 sm:gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-6 sm:gap-[32px] row-start-2 items-center sm:items-start">
        <div className="w-full max-w-xl flex justify-center">
          <Image 
            src="/@roofm2_logo.svg" 
            alt="Roofm² Logo" 
            width={576}
            height={174}
            priority
            className="mb-2 sm:mb-4 h-12 sm:h-20"
          />
        </div>
        <div className="w-full max-w-xl mb-2 sm:mb-4">
          <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
        </div>
        <div className="mb-2 w-full max-w-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-0 sm:items-center sm:justify-between">
            <button 
              onClick={clearPolygons} 
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm font-medium"
            >
              Clear Polygons
            </button>
            {areaSqm !== null && (
              <div className="text-center font-semibold text-base sm:text-lg text-gray-700 py-2">
                {formattedArea}
              </div>
            )}
            {areaSqm !== null && <UnitToggle />}
          </div>
        </div>
        <div className="w-full max-w-xl mb-4">
          <Map center={center} onPolygonComplete={handlePolygonComplete} />
        </div>
        {isLoading && areaSqm != null && (
          <div className="w-full max-w-xl text-center py-4 sm:py-8">
            <p className="text-lg sm:text-xl">Loading...</p>
          </div>
        )}
        {!isLoading && hasData && (
          <div className="w-full max-w-xl">
            <ReportDownload
              address={address}
              areaSqm={areaSqm}
              monthlySolar={monthlySolar}
              monthlyPrecip={monthlyPrecip}
            />
          </div>
        )}
      </main>
      <footer>{/* Empty footer, or add your own content */}</footer>
    </div>
  );
} 