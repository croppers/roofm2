/**
 * Utility functions for fetching climate data from NASA POWER via the backend API
 */

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

/**
 * Fetch climate data for solar energy and rainfall calculations
 * 
 * @param lat Latitude in decimal degrees
 * @param lon Longitude in decimal degrees
 * @param area_m2 Roof area in square meters
 * @returns Climate data including solar and rainfall calculations
 * @throws Error if data fetching fails
 */
export async function fetchClimateData(
  lat: number,
  lon: number,
  area_m2: number
): Promise<ClimateData> {
  const response = await fetch(`/api/climate?lat=${lat}&lon=${lon}&area_m2=${area_m2}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch climate data');
  }
  
  return await response.json();
}

/**
 * Calculate roof area from satellite image
 * 
 * @param lat Latitude in decimal degrees
 * @param lon Longitude in decimal degrees
 * @param zoom Optional zoom level (default: 20)
 * @returns Object with roof area in square meters and square feet
 * @throws Error if area calculation fails
 */
export async function calculateRoofArea(
  lat: number,
  lon: number,
  zoom: number = 20
): Promise<{ area_m2: number; area_ft2: number; contour: number[][], meters_per_pixel: number }> {
  const response = await fetch(`/api/area?lat=${lat}&lon=${lon}&zoom=${zoom}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to calculate roof area');
  }
  
  return await response.json();
} 