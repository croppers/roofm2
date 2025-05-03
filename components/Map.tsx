'use client';
import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';
import { calculateAreaSqMeters } from '../utils/area';
import { sqmToSqft, roundDecimal } from '../utils/unitConversion';
import { useSearchParams } from 'next/navigation';
import UnitToggle from './UnitToggle';

const containerStyle = {
  width: '100%',
  height: '400px'
};

interface MapProps {
  center: google.maps.LatLngLiteral;
}

export default function Map({ center }: MapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['drawing', 'places']
  });

  // Read unit preference from URL
  const searchParams = useSearchParams()!;
  const unitsParam = searchParams.get('units');
  const units = unitsParam === 'imperial' ? 'imperial' : 'metric';

  // State to hold computed area
  const [areaResult, setAreaResult] = useState<{ sqm: number; sqft: number } | null>(null);
  // State to hold drawn polygon instances
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }
  if (!isLoaded) {
    return <div>Loading Maps...</div>;
  }

  // Handle when a user finishes drawing a polygon
  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coords: { lat: number; lng: number }[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ lat: point.lat(), lng: point.lng() });
    }
    const sqm = calculateAreaSqMeters(coords);
    const sqft = sqmToSqft(sqm);
    setAreaResult({ sqm: roundDecimal(sqm), sqft: roundDecimal(sqft) });
    // Save polygon instance for clearing later
    setPolygons(prev => [...prev, polygon]);
  };

  // Remove all drawn polygons from the map
  const clearPolygons = () => {
    polygons.forEach(p => p.setMap(null));
    setPolygons([]);
    setAreaResult(null);
  };

  return (
    <>
      <div className="mb-2 flex justify-between items-center">
        <button onClick={clearPolygons} className="px-3 py-1 bg-red-500 text-white rounded">
          Clear Polygons
        </button>
        {areaResult && <UnitToggle />}
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={18}
        options={{
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          tilt: 0,
          disableDefaultUI: true
        }}
      >
        <DrawingManager
          drawingMode={google.maps.drawing.OverlayType.POLYGON}
          onPolygonComplete={handlePolygonComplete}
          options={{
            drawingControl: true,
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [google.maps.drawing.OverlayType.POLYGON]
            }
          }}
        />
      </GoogleMap>
      {areaResult && (
        <div className="mt-2">
          <div className="p-2 bg-white rounded shadow">
            <p className="text-sm">
              {units === 'metric'
                ? `Area: ${areaResult.sqm} m²`
                : `Area: ${areaResult.sqft} ft²`}
            </p>
          </div>
        </div>
      )}
    </>
  );
} 