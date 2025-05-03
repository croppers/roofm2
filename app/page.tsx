'use client';
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Map from '../components/Map';
import AddressAutocomplete from '../components/AddressAutocomplete';
import UnitToggle from '../components/UnitToggle';
import ReportDownload from '../components/ReportDownload';
import { calculateAreaSqMeters, getPolygonCentroid } from '../utils/area';
import { roundDecimal } from '../utils/unitConversion';

export default function Home() {
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
      // Convert m² to ft² (1 m² = 10.7639 ft²)
      const areaFt = areaSqm * 10.7639;
      setFormattedArea(`${areaFt.toLocaleString(undefined, {maximumFractionDigits: 1})} ft²`);
    } else {
      setFormattedArea(`${areaSqm.toLocaleString(undefined, {maximumFractionDigits: 1})} m²`);
    }
  }, [areaSqm, units]);
  
  // Handle address selection
  const handlePlaceSelected = (coords: { lat: number; lng: number }, addr: string) => {
    setCenter(coords);
    setAddress(addr);
  };
  
  // Handle polygon drawing complete
  const handlePolygonComplete = async (polygon: google.maps.Polygon, coords: google.maps.LatLngLiteral[]) => {
    // Clear previous data
    polygons.forEach(p => p.setMap(null));
    setPolygons([polygon]);
    
    // Calculate area
    const sqm = calculateAreaSqMeters(coords);
    setAreaSqm(roundDecimal(sqm));
    
    // Set loading state
    setIsLoading(true);
    
    // Calculate centroid for API call
    const centerCoord = getPolygonCentroid(coords);
    
    // Fetch climatology
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
  
  // Clear polygons
  const clearPolygons = () => {
    polygons.forEach(p => p.setMap(null));
    setPolygons([]);
    setAreaSqm(null);
    setMonthlySolar({});
    setMonthlyPrecip({});
    setIsLoading(false);
  };

  // Check if we have valid data to show the report
  const hasData = areaSqm != null && 
                  Object.keys(monthlySolar).length > 0 && 
                  Object.keys(monthlyPrecip).length > 0;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Logo header using next/image with the SVG file - sized to match the search box width */}
        <div className="w-full max-w-xl flex justify-center">
          <Image 
            src="/@roofm2_logo.svg" 
            alt="Roofm² Logo" 
            width={576}
            height={174}
            priority
            className="mb-4"
          />
        </div>
        
        <div className="w-full max-w-xl mb-4">
          <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
        </div>
        
        <div className="mb-2 w-full max-w-xl">
          <div className="flex items-center justify-between">
            <button onClick={clearPolygons} className="px-3 py-1 bg-red-500 text-white rounded">
              Clear Polygons
            </button>
            
            {areaSqm !== null && (
              <div className="text-center font-semibold text-lg">
                {formattedArea}
              </div>
            )}
            
            {areaSqm !== null && <UnitToggle />}
          </div>
        </div>
        
        <div className="w-full max-w-xl mb-4">
          <Map center={center} onPolygonComplete={handlePolygonComplete} />
        </div>
        
        {/* Loading state */}
        {isLoading && areaSqm != null && (
          <div className="w-full max-w-xl text-center py-8">
            <p className="text-xl">Loading...</p>
          </div>
        )}
        
        {/* Report section (only show when data is loaded) */}
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
