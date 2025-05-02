import httpx
import os
from dotenv import load_dotenv
from typing import Dict, Any, List, Tuple
import calendar

# Load environment variables
load_dotenv()

POWER_BASE = os.getenv("NEXT_PUBLIC_POWER_BASE", "https://power.larc.nasa.gov/api")
RUNOFF_COEFF = float(os.getenv("NEXT_PUBLIC_RUNOFF_COEFF", "0.9"))

# Map of month numbers to month abbreviations used by NASA POWER API
MONTH_ABBR = {
    1: 'JAN', 2: 'FEB', 3: 'MAR', 4: 'APR',
    5: 'MAY', 6: 'JUN', 7: 'JUL', 8: 'AUG',
    9: 'SEP', 10: 'OCT', 11: 'NOV', 12: 'DEC'
}

async def fetch_power_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch climatology data from NASA POWER API
    
    Args:
        lat: Latitude in decimal degrees
        lon: Longitude in decimal degrees
        
    Returns:
        Dictionary with NASA POWER API response
    """
    url = f"{POWER_BASE}/temporal/climatology/point"
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,PRECTOTCORR",  # Updated to use PRECTOTCORR
        "community": "SB",
        "longitude": lon,
        "latitude": lat,
        "format": "JSON"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"NASA POWER API error: {response.text}")
        
        return response.json()

def calculate_monthly_solar_energy(power_data: Dict[str, Any], roof_area_m2: float) -> List[Dict[str, Any]]:
    """
    Calculate monthly solar energy production based on NASA POWER data
    
    Args:
        power_data: Response from NASA POWER API
        roof_area_m2: Roof area in square meters
        
    Returns:
        List of monthly solar energy production calculations
    """
    monthly_data = []
    
    # Get solar radiation data (ALLSKY_SFC_SW_DWN is in kWh/m²/day)
    solar_data = power_data["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]
    
    # Current year for calculating days in month
    current_year = 2024  # Using a leap year for February
    
    # Efficiency factor for solar panels (typical values: 15-20%)
    SOLAR_EFFICIENCY = 0.15  # 15% solar panel efficiency
    
    # System losses (inverter efficiency, wiring, etc.)
    SYSTEM_EFFICIENCY = 0.80  # 80% system efficiency
    
    total_annual_kwh = 0
    
    for month_num in range(1, 13):
        month_name = calendar.month_name[month_num]
        days_in_month = calendar.monthrange(current_year, month_num)[1]
        
        # Get the month abbreviation for the API response (JAN, FEB, etc.)
        month_abbr = MONTH_ABBR[month_num]
        
        # Daily radiation for this month (kWh/m²/day)
        daily_radiation = solar_data[month_abbr]
        
        # Monthly radiation (kWh/m²/month)
        monthly_radiation = daily_radiation * days_in_month
        
        # Total energy production for the roof area (kWh), including efficiency factors
        # Handle case where roof_area_m2 might be 0
        if roof_area_m2 <= 0:
            monthly_energy_kwh = 0
        else:
            monthly_energy_kwh = monthly_radiation * roof_area_m2 * SOLAR_EFFICIENCY * SYSTEM_EFFICIENCY
        
        # Add to annual total
        total_annual_kwh += monthly_energy_kwh
        
        monthly_data.append({
            "month": month_name,
            "month_num": month_num,
            "days": days_in_month,
            "daily_radiation_kwh_m2": daily_radiation,
            "monthly_radiation_kwh_m2": monthly_radiation,
            "energy_kwh": monthly_energy_kwh
        })
    
    # Add annual total to each month for convenience
    for month in monthly_data:
        month["annual_total_kwh"] = total_annual_kwh
    
    return monthly_data

def calculate_monthly_rainfall_harvest(power_data: Dict[str, Any], roof_area_m2: float) -> List[Dict[str, Any]]:
    """
    Calculate monthly rainwater harvest based on NASA POWER data
    
    Args:
        power_data: Response from NASA POWER API
        roof_area_m2: Roof area in square meters
        
    Returns:
        List of monthly rainwater harvest calculations
    """
    monthly_data = []
    
    # Get precipitation data (PRECTOTCORR is in mm/day)
    precip_data = power_data["properties"]["parameter"]["PRECTOTCORR"]  # Updated to use PRECTOTCORR
    
    # Current year for calculating days in month
    current_year = 2024  # Using a leap year for February
    
    total_annual_liters = 0
    total_annual_gallons = 0
    
    for month_num in range(1, 13):
        month_name = calendar.month_name[month_num]
        days_in_month = calendar.monthrange(current_year, month_num)[1]
        
        # Get the month abbreviation for the API response (JAN, FEB, etc.)
        month_abbr = MONTH_ABBR[month_num]
        
        # Daily precipitation for this month (mm/day)
        daily_precip_mm = precip_data[month_abbr]
        
        # Monthly precipitation (mm/month)
        monthly_precip_mm = daily_precip_mm * days_in_month
        
        # Convert mm to m (1 mm = 0.001 m)
        monthly_precip_m = monthly_precip_mm * 0.001
        
        # Handle case where roof_area_m2 might be 0
        if roof_area_m2 <= 0:
            water_volume_m3 = 0
        else:
            # Calculate water volume (m³) = area (m²) × depth (m) × runoff coefficient
            water_volume_m3 = roof_area_m2 * monthly_precip_m * RUNOFF_COEFF
        
        # Convert to liters (1 m³ = 1000 L)
        water_volume_liters = water_volume_m3 * 1000
        
        # Convert to gallons (1 L = 0.264172 gal)
        water_volume_gallons = water_volume_liters * 0.264172
        
        # Add to annual totals
        total_annual_liters += water_volume_liters
        total_annual_gallons += water_volume_gallons
        
        monthly_data.append({
            "month": month_name,
            "month_num": month_num,
            "days": days_in_month,
            "daily_precip_mm": daily_precip_mm,
            "monthly_precip_mm": monthly_precip_mm,
            "water_liters": water_volume_liters,
            "water_gallons": water_volume_gallons
        })
    
    # Add annual total to each month for convenience
    for month in monthly_data:
        month["annual_total_liters"] = total_annual_liters
        month["annual_total_gallons"] = total_annual_gallons
    
    return monthly_data 