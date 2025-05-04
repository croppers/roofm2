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
    <div className="min-h-screen container mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-x-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center sm:items-start w-full">
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
        {/* Address Input */}
        <div className="w-1/2 mx-auto mb-8">
          <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
        </div>
        {/* Controls Row */}
        <div className="flex flex-col items-center sm:flex-row sm:justify-center sm:items-center gap-2 w-full mb-8">
          <button
            onClick={clearPolygons}
            className="w-1/2 mx-auto px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm font-medium"
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
        
        {/* Map and Data Container with relative positioning */}
        <div className="w-full flex items-center justify-center" style={{ position: 'relative' }}>
          {/* Map Container */}
          <div className="w-1/2" style={{ aspectRatio: '1/1' }}>
            <Map center={center} onPolygonComplete={handlePolygonComplete} />
          </div>
          
          {/* Data Container - Absolutely positioned */}
          <div style={{ position: 'absolute', top: '100%', width: '100%', marginTop: '20px' }}>
            {/* Loading */}
            {isLoading && areaSqm != null && (
              <div className="w-full text-center">
                <p className="text-lg sm:text-xl">Loading...</p>
              </div>
            )}
            
            {/* Report */}
            {!isLoading && hasData && (
              <ReportDownload
                address={address}
                areaSqm={areaSqm}
                monthlySolar={monthlySolar}
                monthlyPrecip={monthlyPrecip}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 