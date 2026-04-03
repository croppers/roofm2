'use client';
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface MapProps {
  center: { lat: number; lng: number };
  onPolygonComplete: (coords: { lat: number; lng: number }[]) => void;
}

export default function Map({ center, onPolygonComplete }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 18,
      zoomControl: true,
    });

    // Esri World Imagery - free satellite tiles, no API key
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 20,
    }).addTo(map);

    // Drawing layer
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Drawing control - polygon only
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            fillOpacity: 0.3,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Handle polygon creation
    map.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);

      const latlngs = (event.layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
      const coords = latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));
      onPolygonComplete(coords);
    });

    // Handle polygon deletion
    map.on(L.Draw.Event.DELETED, () => {
      onPolygonComplete([]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], 18);
    }
  }, [center]);

  return (
    <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 h-full">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
