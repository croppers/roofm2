import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number; formatted_address: string } | null>(null);
  
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/coords?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to geocode address');
      }
      
      const data = await response.json();
      setCoordinates(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>RoofM² - Roof Measurement Tool</title>
        <meta name="description" content="Calculate roof area, solar potential, and rainwater harvesting potential" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          RoofM² - Roof Area Calculator
        </h1>
        
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleAddressSubmit}>
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St, City, Country"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Find Roof'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {coordinates && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Location Found</h3>
              <p className="mb-1"><span className="font-medium">Address:</span> {coordinates.formatted_address}</p>
              <p className="mb-1"><span className="font-medium">Latitude:</span> {coordinates.lat}</p>
              <p className="mb-1"><span className="font-medium">Longitude:</span> {coordinates.lon}</p>
              
              <div className="mt-4">
                <a
                  href={`/roof?lat=${coordinates.lat}&lon=${coordinates.lon}&address=${encodeURIComponent(coordinates.formatted_address)}`}
                  className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  View Roof
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 