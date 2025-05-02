import asyncio
import sys
from power_api import fetch_power_data, calculate_monthly_solar_energy, calculate_monthly_rainfall_harvest

async def test_climate_api(lat, lon, area_m2):
    """Test the NASA POWER API and climate calculations after fixes"""
    try:
        print(f"Fetching POWER data for lat={lat}, lon={lon}...")
        power_data = await fetch_power_data(lat, lon)
        print("✅ Successfully fetched POWER data")
        
        print(f"\nCalculating solar energy for area_m2={area_m2}...")
        solar_data = calculate_monthly_solar_energy(power_data, area_m2)
        print("✅ Successfully calculated solar energy")
        print(f"January solar generation: {solar_data[0]['energy_kwh']:.2f} kWh")
        print(f"Annual total: {solar_data[0]['annual_total_kwh']:.2f} kWh")
        
        print(f"\nCalculating rainfall harvest for area_m2={area_m2}...")
        rainfall_data = calculate_monthly_rainfall_harvest(power_data, area_m2)
        print("✅ Successfully calculated rainfall harvest")
        print(f"January rainfall harvest: {rainfall_data[0]['water_liters']:.2f} liters")
        print(f"Annual total: {rainfall_data[0]['annual_total_liters']:.2f} liters")
        
        # Print a sample of monthly data
        print("\nSample Monthly Data:")
        print("-" * 60)
        print(f"{'Month':<10} {'Solar (kWh)':<15} {'Rainfall (L)':<15} {'Rainfall (gal)':<15}")
        print("-" * 60)
        for i in range(len(solar_data)):
            solar = solar_data[i]
            rain = rainfall_data[i]
            print(f"{solar['month']:<10} {solar['energy_kwh']:<15.2f} {rain['water_liters']:<15.2f} {rain['water_gallons']:<15.2f}")
        
        return True
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test values from the error logs
    tests = [
        {"lat": 34.0317879, "lon": -118.4435635, "area": 0, "name": "Zero Area Test"},
        {"lat": 34.0317879, "lon": -118.4435635, "area": 149.8491808295858, "name": "Normal Area Test"}
    ]
    
    for test in tests:
        print(f"\n{'='*70}")
        print(f"TESTING: {test['name']} (area = {test['area']} m²)")
        print(f"{'='*70}")
        
        result = asyncio.run(test_climate_api(test['lat'], test['lon'], test['area']))
        
        if result:
            print(f"\n✅ {test['name']} PASSED")
        else:
            print(f"\n❌ {test['name']} FAILED") 