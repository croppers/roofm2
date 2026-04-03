'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface MapProps {
  center: { lat: number; lng: number };
  onPolygonComplete: (coords: { lat: number; lng: number }[]) => void;
  outlineCoords?: { lat: number; lng: number }[] | null;
}

export default function Map({ center, onPolygonComplete, outlineCoords }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const onPolygonCompleteRef = useRef(onPolygonComplete);
  onPolygonCompleteRef.current = onPolygonComplete;

  const drawPolygon = useCallback((coords: { lat: number; lng: number }[]) => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems || coords.length === 0) return;

    drawnItems.clearLayers();
    const latlngs = coords.map(c => L.latLng(c.lat, c.lng));
    const polygon = L.polygon(latlngs, {
      color: '#3b82f6',
      weight: 2,
      fillOpacity: 0.3,
    });
    drawnItems.addLayer(polygon);
    onPolygonCompleteRef.current(coords);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 18,
      zoomControl: true,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 20,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

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

    map.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      const latlngs = (event.layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
      const coords = latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));
      onPolygonCompleteRef.current(coords);
    });

    map.on(L.Draw.Event.DELETED, () => {
      onPolygonCompleteRef.current([]);
    });

    // Recalculate area after editing
    map.on(L.Draw.Event.EDITED, () => {
      const layers = drawnItems.getLayers();
      if (layers.length > 0) {
        const latlngs = (layers[0] as L.Polygon).getLatLngs()[0] as L.LatLng[];
        const coords = latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));
        onPolygonCompleteRef.current(coords);
      }
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

  // Draw auto-outline when outlineCoords changes
  useEffect(() => {
    if (outlineCoords && outlineCoords.length > 0) {
      drawPolygon(outlineCoords);
    }
  }, [outlineCoords, drawPolygon]);

  return (
    <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 h-full">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
