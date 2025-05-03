'use client';
import React from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

// Calculate the height for a square aspect ratio (1:1)
// For a container with 100% width, the height should be equal to width
const containerStyle = {
  width: '100%',
  height: 0, // Will be set dynamically based on width
  paddingBottom: '100%', // This creates a 1:1 aspect ratio (square)
  position: 'relative' as const // TypeScript needs this type assertion
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
    return <div>Error loading maps</div>;
  }
  if (!isLoaded) {
    return <div>Loading Maps...</div>;
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
    <div style={containerStyle}>
      <GoogleMap
        mapContainerStyle={mapStyle}
        center={center}
        zoom={18}
        options={{
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          tilt: 0,
          // Show only essential controls
          disableDefaultUI: true,
          zoomControl: true
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