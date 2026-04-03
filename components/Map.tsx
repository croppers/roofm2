'use client';
import React from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: 0,
  paddingBottom: '75%',
  position: 'relative' as const,
  overflow: 'hidden'
};

const mapStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%'
};

interface MapProps {
  center: google.maps.LatLngLiteral;
  onPolygonComplete: (polygon: google.maps.Polygon, coords: google.maps.LatLngLiteral[]) => void;
}

export default function Map({ center, onPolygonComplete }: MapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['drawing', 'places']
  });

  if (loadError) {
    return (
      <div className="card flex flex-col items-center justify-center p-12 text-center" style={{ aspectRatio: '4/3' }}>
        <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Unable to load map</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-sm">
          There was a problem loading Google Maps. Please check your internet connection and try refreshing.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="card flex flex-col items-center justify-center p-12 animate-pulse" style={{ aspectRatio: '4/3' }}>
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="text-gray-400 dark:text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coords: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const pt = path.getAt(i);
      coords.push({ lat: pt.lat(), lng: pt.lng() });
    }
    onPolygonComplete(polygon, coords);
  };

  return (
    <div style={containerStyle} className="rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
      <GoogleMap
        mapContainerStyle={mapStyle}
        center={center}
        zoom={18}
        options={{
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          tilt: 0,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true
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
    </div>
  );
}
