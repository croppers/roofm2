from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import httpx
from typing import Dict, Any
from cv import calculate_meters_per_pixel, process_satellite_image, calculate_real_area
from power_api import fetch_power_data, calculate_monthly_solar_energy, calculate_monthly_rainfall_harvest

# Load environment variables
load_dotenv()

app = FastAPI(title="RoofM² Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to RoofM² API"}

@app.get("/api/geocode")
async def geocode(address: str):
    """
    Endpoint to geocode an address using Google Geocoding API
    """
    geocoding_key = os.getenv("GEOCODING_KEY")
    if not geocoding_key:
        raise HTTPException(status_code=500, detail="Geocoding API key not configured")
    
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={geocoding_key}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()
            
            if data["status"] != "OK":
                raise HTTPException(
                    status_code=400, 
                    detail=f"Geocoding failed: {data['status']}"
                )
                
            result = data["results"][0]
            location = result["geometry"]["location"]
            
            return {
                "lat": location["lat"],
                "lon": location["lng"],
                "formatted_address": result["formatted_address"]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding request failed: {str(e)}")

@app.get("/api/satellite")
async def get_satellite_image(lat: float, lon: float, zoom: int = 20):
    """
    Endpoint to fetch a satellite image from Google Static Maps API
    """
    maps_key = os.getenv("STATIC_MAP_KEY")
    if not maps_key:
        raise HTTPException(status_code=500, detail="Static Maps API key not configured")
    
    try:
        url = f"https://maps.googleapis.com/maps/api/staticmap?center={lat},{lon}&zoom={zoom}&size=640x640&maptype=satellite&key={maps_key}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to fetch satellite image: {response.text}"
                )
            
            # Return image bytes directly
            return response.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satellite image request failed: {str(e)}")

@app.get("/api/area")
async def calculate_area(lat: float, lon: float, zoom: int = 20):
    """
    Endpoint to calculate roof area from satellite image
    """
    maps_key = os.getenv("STATIC_MAP_KEY")
    if not maps_key:
        raise HTTPException(status_code=500, detail="Static Maps API key not configured")
    
    try:
        # Fetch satellite image
        url = f"https://maps.googleapis.com/maps/api/staticmap?center={lat},{lon}&zoom={zoom}&size=640x640&maptype=satellite&key={maps_key}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to fetch satellite image: {response.text}"
                )
            
            # Process image with OpenCV
            area_px, contour_points = process_satellite_image(response.content)
            
            # Calculate meters per pixel
            meters_per_pixel = calculate_meters_per_pixel(lat, zoom)
            
            # Calculate real-world area
            area_m2, area_ft2 = calculate_real_area(area_px, meters_per_pixel)
            
            return {
                "area_px": area_px,
                "area_m2": area_m2,
                "area_ft2": area_ft2,
                "contour": contour_points,
                "meters_per_pixel": meters_per_pixel
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Area calculation failed: {str(e)}")

@app.get("/api/climate")
async def get_climate_data(lat: float, lon: float, area_m2: float):
    """
    Endpoint to fetch climate data and calculate solar/water potential
    """
    try:
        # Fetch NASA POWER data
        power_data = await fetch_power_data(lat, lon)
        
        # Calculate solar energy potential
        solar_data = calculate_monthly_solar_energy(power_data, area_m2)
        
        # Calculate rainwater harvest potential
        rainfall_data = calculate_monthly_rainfall_harvest(power_data, area_m2)
        
        return {
            "solar": solar_data,
            "rainfall": rainfall_data,
            "location": {
                "lat": lat,
                "lon": lon
            },
            "roof_area_m2": area_m2,
            "roof_area_ft2": area_m2 * 10.7639
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Climate data calculation failed: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for Render
    """
    return {"status": "healthy"} 