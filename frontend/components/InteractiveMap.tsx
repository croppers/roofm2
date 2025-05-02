import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, DrawingManager } from '@react-google-maps/api';

interface InteractiveMapProps {
  lat: number;
  lon: number;
  onPolygonComplete: (area: number) => void; // Callback to pass the area up
}

const containerStyle = {
  width: '100%',
  height: '500px'
};

const libraries: ("drawing" | "geometry")[] = ["drawing", "geometry"];

const InteractiveMap: React.FC<InteractiveMapProps> = ({ lat, lon, onPolygonComplete }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isDrawingManagerLoaded, setIsDrawingManagerLoaded] = useState(false);
  
  // Debug logs for rendered state
  useEffect(() => {
    console.log('Component render state:', {
      isScriptLoaded,
      isDrawingManagerLoaded,
      hasMap: !!map,
      hasDrawingManager: !!drawingManager,
      hasPolygon: !!polygonRef.current,
      apiKeyLength: apiKey?.length || 0,
    });
  });

  const onMapLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    console.log("Map loaded successfully");
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    console.log("Map unmounted");
    setMap(null);
    setDrawingManager(null);
  }, []);

  const onDrawingManagerLoad = useCallback((manager: google.maps.drawing.DrawingManager) => {
    console.log("Drawing manager loaded");
    setDrawingManager(manager);
    setIsDrawingManagerLoaded(true);
    
    // Try to activate drawing mode right after loading
    try {
      if (window.google && window.google.maps) {
        console.log("Setting initial drawing mode");
        manager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      }
    } catch (error) {
      console.error("Error setting initial drawing mode:", error);
    }
  }, []);

  const onPolygonCompleteEvent = useCallback((polygon: google.maps.Polygon) => {
    console.log("Polygon drawing completed");
    
    // A new polygon is drawn
    if (polygonRef.current) {
      console.log("Removing previous polygon");
      polygonRef.current.setMap(null); // Remove the previous polygon if exists
    }
    
    polygonRef.current = polygon;
    
    // Disable drawing mode after one polygon is drawn
    if (drawingManager) {
      console.log("Disabling drawing mode after completion");
      drawingManager.setDrawingMode(null);
    }
  }, [drawingManager]);

  const handleCalculateArea = () => {
    console.log("Calculate area button clicked");
    
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      console.error("Google Maps API not fully loaded");
      alert('Google Maps API is not fully loaded yet. Please try again in a moment.');
      return;
    }
    
    if (polygonRef.current) {
      console.log("Calculating area of polygon");
      const path = polygonRef.current.getPath();
      const area = google.maps.geometry.spherical.computeArea(path);
      console.log("Area calculated:", area, "square meters");
      onPolygonComplete(area); // Send area back to parent
    } else {
      console.warn("No polygon drawn yet");
      alert('Please draw a polygon on the map first.');
    }
  };

  const handleClearPolygon = () => {
    console.log("Clear polygon button clicked");
    
    if (polygonRef.current) {
      console.log("Removing polygon");
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    
    // Re-enable drawing mode
    activateDrawingMode();
  };

  const onScriptLoad = useCallback(() => {
    console.log("Google Maps script loaded");
    setIsScriptLoaded(true);
  }, []);

  // Function to explicitly activate drawing mode
  const activateDrawingMode = () => {
    console.log("Activate drawing mode button clicked");
    console.log("Current state:", {
      drawingManager: !!drawingManager,
      googleMaps: !!window.google?.maps,
      drawingNamespace: !!window.google?.maps?.drawing,
    });
    
    try {
      if (drawingManager && window.google && window.google.maps && window.google.maps.drawing) {
        const polygonMode = window.google.maps.drawing.OverlayType.POLYGON;
        console.log("Setting drawing mode to POLYGON");
        
        // Force rerender of drawing manager to ensure it's active
        drawingManager.setOptions({
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [polygonMode],
          }
        });
        
        // Set drawing mode
        drawingManager.setDrawingMode(polygonMode);
        
        // Additional check - force drawing control to be visible
        const element = document.querySelector('.gm-style-mtc');
        if (element) {
          console.log("Drawing control element found, ensuring visibility");
          (element as HTMLElement).style.display = 'block';
        } else {
          console.warn("Drawing control element not found in DOM");
        }
      } else {
        console.error("Could not activate drawing mode - required objects not available");
        if (!drawingManager) console.error("Drawing manager not loaded");
        if (!window.google?.maps) console.error("Google Maps not loaded");
        if (!window.google?.maps?.drawing) console.error("Drawing namespace not loaded");
        
        alert("Could not activate drawing mode. Please refresh the page and try again.");
      }
    } catch (error) {
      console.error("Error activating drawing mode:", error);
    }
  };

  // Create manual polygon drawing tool as fallback
  const [manualDrawingActive, setManualDrawingActive] = useState(false);
  const [manualPoints, setManualPoints] = useState<{lat: number, lng: number}[]>([]);
  
  const startManualDrawing = () => {
    console.log("Starting manual polygon drawing");
    setManualDrawingActive(true);
    setManualPoints([]);
    
    // Remove any existing polygon
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    
    // Create a temporary polygon that will update as points are added
    if (map && window.google?.maps) {
      const tempPolygon = new google.maps.Polygon({
        paths: [],
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map
      });
      
      polygonRef.current = tempPolygon;
      
      // Add click listener to map
      const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          console.log("Added point:", newPoint);
          
          // Update state for React
          const updatedPoints = [...manualPoints, newPoint];
          setManualPoints(updatedPoints);
          
          // Update polygon paths directly
          tempPolygon.setPath(updatedPoints);
        }
      });
      
      // Store listener for cleanup
      return () => {
        google.maps.event.removeListener(clickListener);
      };
    }
  };
  
  const completeManualDrawing = () => {
    console.log("Completing manual polygon drawing");
    setManualDrawingActive(false);
    
    if (manualPoints.length < 3) {
      console.warn("Not enough points for polygon");
      alert("Please add at least 3 points to create a polygon");
      return;
    }
    
    // The polygon is already created and updated during drawing,
    // we just need to make it editable now
    if (polygonRef.current && window.google?.maps) {
      polygonRef.current.setOptions({
        editable: true
      });
    }
  };

  if (!apiKey) {
    return <div>Error: Maps API Key is not configured.</div>;
  }

  return (
    <div className="relative">
      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={libraries}
        onLoad={onScriptLoad}
      >
        {isScriptLoaded && (
          <>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={{ lat, lng: lon }}
              zoom={20}
              mapTypeId="satellite"
              onLoad={onMapLoad}
              onUnmount={onUnmount}
            >
              {window.google && window.google.maps && (
                <DrawingManager
                  onLoad={onDrawingManagerLoad}
                  onPolygonComplete={onPolygonCompleteEvent}
                  options={{
                    drawingControl: true,
                    drawingControlOptions: {
                      position: window.google.maps.ControlPosition.TOP_CENTER,
                      drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
                    },
                    polygonOptions: {
                      fillColor: '#FF0000',
                      fillOpacity: 0.3,
                      strokeWeight: 2,
                      clickable: true,
                      editable: true,
                      zIndex: 1,
                    },
                  }}
                />
              )}
              
              {/* No need for special rendering for manual points, as we directly manipulate the Google Maps API */}
              {manualDrawingActive && (
                <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow z-10">
                  <p className="text-sm font-semibold">{manualPoints.length} points added</p>
                  <p className="text-xs">Click on map to add points.</p>
                </div>
              )}
            </GoogleMap>
            
            {/* Instructions */}
            <div className="mt-2 mb-3 text-sm bg-blue-50 p-2 rounded">
              <p><strong>Drawing Tools:</strong> Look for the polygon tool in the map controls at the top center. 
              If not visible, use the buttons below.</p>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <button 
                onClick={activateDrawingMode}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
              >
                Draw with Polygon Tool
              </button>
              
              {!manualDrawingActive ? (
                <button 
                  onClick={startManualDrawing}
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700"
                >
                  Draw by Clicking Map
                </button>
              ) : (
                <button 
                  onClick={completeManualDrawing}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
                >
                  Complete Manual Drawing
                </button>
              )}
              
              <button 
                onClick={handleCalculateArea}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
              >
                Calculate Area & Get Climate Data
              </button>
              
              <button 
                onClick={handleClearPolygon}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700"
              >
                Clear Polygon
              </button>
            </div>
            
            {/* Debug panel during development */}
            <div className="mt-4 p-2 bg-gray-100 text-xs">
              <details>
                <summary>Debug Info (click to expand)</summary>
                <div>
                  <p>Script loaded: {isScriptLoaded ? 'Yes' : 'No'}</p>
                  <p>Drawing Manager loaded: {isDrawingManagerLoaded ? 'Yes' : 'No'}</p>
                  <p>Map loaded: {map ? 'Yes' : 'No'}</p>
                  <p>Polygon exists: {polygonRef.current ? 'Yes' : 'No'}</p>
                  <p>Manual drawing active: {manualDrawingActive ? 'Yes' : 'No'}</p>
                  <p>Manual points: {manualPoints.length}</p>
                  <p>Please check browser console (F12) for detailed logs.</p>
                </div>
              </details>
            </div>
          </>
        )}
        {!isScriptLoaded && (
          <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Loading Google Maps...</div>
          </div>
        )}
      </LoadScript>
    </div>
  );
};

export default InteractiveMap; 