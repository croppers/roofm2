import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

type ClimateData = {
  solar: {
    month: string;
    month_num: number;
    days: number;
    daily_radiation_kwh_m2: number;
    monthly_radiation_kwh_m2: number;
    energy_kwh: number;
    annual_total_kwh: number;
  }[];
  rainfall: {
    month: string;
    month_num: number;
    days: number;
    daily_precip_mm: number;
    monthly_precip_mm: number;
    water_liters: number;
    water_gallons: number;
    annual_total_liters: number;
    annual_total_gallons: number;
  }[];
  location: {
    lat: number;
    lon: number;
  };
  roof_area_m2: number;
  roof_area_ft2: number;
};

export default function RoofPage() {
  const router = useRouter();
  const { lat, lon, address } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [areaData, setAreaData] = useState<{ area_m2: number; area_ft2: number } | null>(null);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [step, setStep] = useState(1); // 1: Loading/Area, 2: Results, 3: Download
  
  useEffect(() => {
    if (!lat || !lon) return;
    
    const fetchAreaData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch area data from backend
        const areaResponse = await fetch(`/api/area?lat=${lat}&lon=${lon}`);
        
        if (!areaResponse.ok) {
          const errorData = await areaResponse.json();
          throw new Error(errorData.detail || 'Failed to calculate roof area');
        }
        
        const areaResult = await areaResponse.json();
        setAreaData(areaResult);
        
        // With area data, fetch climate data
        const climateResponse = await fetch(`/api/climate?lat=${lat}&lon=${lon}&area_m2=${areaResult.area_m2}`);
        
        if (!climateResponse.ok) {
          const errorData = await climateResponse.json();
          throw new Error(errorData.detail || 'Failed to fetch climate data');
        }
        
        const climateResult = await climateResponse.json();
        setClimateData(climateResult);
        
        // Move to results step
        setStep(2);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAreaData();
  }, [lat, lon]);
  
  const handleDownloadReport = () => {
    // Will implement in M4 phase
    setStep(3);
  };
  
  // Loading/error state
  if (loading || !areaData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Head>
          <title>Analyzing Roof - RoofM²</title>
        </Head>
        
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Analyzing Roof
          </h1>
          
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
            {loading ? (
              <div className="py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-lg">Analyzing roof area and climate data...</p>
              </div>
            ) : error ? (
              <div className="py-8">
                <div className="text-red-500 text-xl mb-4">Error</div>
                <p className="mb-6">{error}</p>
                <Link href="/" className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                  Try Another Address
                </Link>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    );
  }
  
  // Results view
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Roof Analysis Results - RoofM²</title>
      </Head>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Roof Analysis Results
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          {address as string}
        </p>
        
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Roof Area</h3>
              <p className="text-3xl font-bold text-blue-700">{areaData.area_m2.toFixed(1)} m²</p>
              <p className="text-lg text-gray-600">{areaData.area_ft2.toFixed(1)} ft²</p>
            </div>
            
            {climateData && (
              <>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">Solar Potential</h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {climateData.solar[0].annual_total_kwh.toFixed(0)} kWh/year
                  </p>
                  <p className="text-lg text-gray-600">Assuming no shade</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">Rainwater Harvest</h3>
                  <p className="text-3xl font-bold text-green-700">
                    {climateData.rainfall[0].annual_total_liters.toFixed(0)} L/year
                  </p>
                  <p className="text-lg text-gray-600">
                    {climateData.rainfall[0].annual_total_gallons.toFixed(0)} gal/year
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* Monthly Breakdown */}
          {climateData && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Monthly Breakdown</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Month</th>
                      <th className="py-2 px-4 border-b text-right">Solar (kWh)</th>
                      <th className="py-2 px-4 border-b text-right">Rainfall (L)</th>
                      <th className="py-2 px-4 border-b text-right">Rainfall (gal)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {climateData.solar.map((month, i) => (
                      <tr key={month.month_num} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border-b">{month.month}</td>
                        <td className="py-2 px-4 border-b text-right">{month.energy_kwh.toFixed(1)}</td>
                        <td className="py-2 px-4 border-b text-right">
                          {climateData.rainfall[i].water_liters.toFixed(1)}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {climateData.rainfall[i].water_gallons.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-between">
            <Link href="/" className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">
              New Analysis
            </Link>
            
            <button
              onClick={handleDownloadReport}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Download Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 