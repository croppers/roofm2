import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import InteractiveMap from '../components/InteractiveMap';

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
  const { lat: latQuery, lon: lonQuery, address } = router.query;
  
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  useEffect(() => {
    if (latQuery && lonQuery && typeof latQuery === 'string' && typeof lonQuery === 'string') {
      const parsedLat = parseFloat(latQuery);
      const parsedLon = parseFloat(lonQuery);
      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        setLat(parsedLat);
        setLon(parsedLon);
        setShowMap(true);
      } else {
        setError('Invalid coordinates provided.');
      }
    } else if (router.isReady && (!latQuery || !lonQuery)) {
      setError('Coordinates are missing from the request.');
    }
  }, [latQuery, lonQuery, router.isReady]);
  
  const handleAreaCalculated = async (areaM2: number) => {
    if (!lat || !lon) {
      setError('Coordinates are missing.');
      return;
    }

    setCalculatedArea(areaM2);
    setLoading(true);
    setError('');

    try {
      const climateResponse = await fetch(`/api/climate?lat=${lat}&lon=${lon}&area_m2=${areaM2}`);
      
      if (!climateResponse.ok) {
        const errorData = await climateResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch climate data');
      }
      
      const climateResult = await climateResponse.json();
      setClimateData(climateResult);
      setShowMap(false);
    } catch (err) {
      setError((err as Error).message);
      setCalculatedArea(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadReport = async () => {
    if (!climateData) {
      setError('No data available for report generation');
      return;
    }
    
    try {
      // Prepare data for PDF generation
      const reportData = {
        address: address as string,
        area_m2: climateData.roof_area_m2,
        area_ft2: climateData.roof_area_ft2,
        solar: climateData.solar,
        rainfall: climateData.rainfall
      };
      
      // Call PDF generation API
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate PDF');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `roof-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Head><title>Error - RoofM²</title></Head>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="mb-6">{error}</p>
          <Link href="/" className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Try Another Address
          </Link>
        </div>
      </div>
    );
  }
  
  if (showMap && lat !== null && lon !== null && !climateData && !loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Head><title>Draw Roof Area - RoofM²</title></Head>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-2">Draw Roof Area</h1>
          <p className="text-center text-gray-600 mb-8">
            {address as string || 'Loading address...'}
          </p>
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <p className="mb-4 text-center">Use the drawing tool (polygon icon) to outline the roof area. Adjust the points as needed, then click 'Calculate Area & Get Climate Data'.</p>
            <InteractiveMap lat={lat} lon={lon} onPolygonComplete={handleAreaCalculated} />
          </div>
        </main>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Head><title>Loading Climate Data - RoofM²</title></Head>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <div className="py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Calculating climate potential...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (climateData && calculatedArea !== null) {
    const areaFt2 = calculatedArea * 10.7639;
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
                <p className="text-3xl font-bold text-blue-700">{calculatedArea.toFixed(1)} m²</p>
                <p className="text-lg text-gray-600">{areaFt2.toFixed(1)} ft²</p>
              </div>
              
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
            </div>
            
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
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Head><title>Loading... - RoofM²</title></Head>
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
} 