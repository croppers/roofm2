'use client';
import Image from "next/image";
import { useState } from 'react';
import Map from '../components/Map';
import AddressAutocomplete from '../components/AddressAutocomplete';
import UnitToggle from '../components/UnitToggle';
import ReportDownload from '../components/ReportDownload';
import { calculateAreaSqMeters } from '../utils/area';
import { roundDecimal } from '../utils/unitConversion';

export default function Home() {
  // Map center and selected address
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: 37.7749, lng: -122.4194 });
  const [address, setAddress] = useState<string>('');
  
  // Polygons and area
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [areaSqm, setAreaSqm] = useState<number | null>(null);
  
  // Climatology data
  const [monthlySolar, setMonthlySolar] = useState<Record<string, number>>({});
  const [monthlyPrecip, setMonthlyPrecip] = useState<Record<string, number>>({});
  
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
    
    // Fetch climatology
    try {
      const res = await fetch(`/api/climate?lat=${coords[0].lat}&lng=${coords[0].lng}`);
      const data = await res.json();
      setMonthlySolar(data.solar || {});
      setMonthlyPrecip(data.precipitation || {});
    } catch (e) {
      console.error('Climatology fetch error', e);
      setMonthlySolar({});
      setMonthlyPrecip({});
    }
  };
  
  // Clear polygons
  const clearPolygons = () => {
    polygons.forEach(p => p.setMap(null));
    setPolygons([]);
    setAreaSqm(null);
    setMonthlySolar({});
    setMonthlyPrecip({});
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>

        <h1 className="text-2xl font-semibold mb-4">Roofm² Estimator</h1>
        <div className="w-full max-w-xl mb-4">
          <AddressAutocomplete onPlaceSelected={handlePlaceSelected} />
        </div>
        <div className="mb-2 flex justify-between items-center w-full max-w-xl">
          <button onClick={clearPolygons} className="px-3 py-1 bg-red-500 text-white rounded">
            Clear Polygons
          </button>
          {areaSqm != null && <UnitToggle />}
        </div>
        <div className="w-full max-w-xl mb-4">
          <Map center={center} onPolygonComplete={handlePolygonComplete} />
        </div>
        {areaSqm != null && monthlySolar && monthlyPrecip && (
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
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
