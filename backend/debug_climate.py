import asyncio
import sys
import traceback
import json
from power_api import fetch_power_data, calculate_monthly_solar_energy, calculate_monthly_rainfall_harvest

async def debug_climate_api(lat, lon, area_m2):
    """Test the NASA POWER API and climate calculations with detailed error reporting"""
    try:
        print(f"Fetching POWER data for lat={lat}, lon={lon}...")
        power_data = await fetch_power_data(lat, lon)
        print("✅ Successfully fetched POWER data")
        
        # Print more detailed information about the structure
        print("\nPOWER DATA STRUCTURE:")
        properties = power_data.get('properties', {})
        parameter = properties.get('parameter', {})
        
        print(f"Top-level keys: {list(power_data.keys())}")
        print(f"Properties keys: {list(properties.keys())}")
        print(f"Parameter keys: {list(parameter.keys())}")
        
        # Inspect the actual structure of the solar data
        solar_key = 'ALLSKY_SFC_SW_DWN'
        precip_key = 'PRECTOT'
        corrected_precip_key = 'PRECTOTCORR'  # NASA might have changed the key name
        
        if solar_key in parameter:
            print(f"\n{solar_key} structure:")
            solar_data = parameter[solar_key]
            print(f"Type: {type(solar_data)}")
            if isinstance(solar_data, dict):
                print(f"Keys: {list(solar_data.keys())}")
            else:
                print(f"First few elements: {str(solar_data)[:100]}...")
        else:
            print(f"\n❗ {solar_key} not found in parameters")
        
        # Check precipitation data keys
        for key in [precip_key, corrected_precip_key]:
            if key in parameter:
                print(f"\n{key} structure:")
                precip_data = parameter[key]
                print(f"Type: {type(precip_data)}")
                if isinstance(precip_data, dict):
                    print(f"Keys: {list(precip_data.keys())}")
                else:
                    print(f"First few elements: {str(precip_data)[:100]}...")
        
        # Let's write the full response to a file for inspection
        with open('nasa_power_response.json', 'w') as f:
            json.dump(power_data, f, indent=2)
        print("\nWrote full response to nasa_power_response.json for inspection")
        
        print("\nTesting is incomplete - need to fix power_api.py based on the actual response structure")
        return False
        
    except Exception as e:
        print("\n❌ ERROR OCCURRED:")
        print(f"Error: {str(e)}")
        print("\nStack trace:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Default values from the error logs
    lat = 34.0317879
    lon = -118.4435635
    
    # Test with just one area value for simplicity
    area = 149.8491808295858
    
    print(f"\n{'='*70}")
    print(f"DEBUGGING NASA POWER API RESPONSE STRUCTURE")
    print(f"{'='*70}")
    
    result = asyncio.run(debug_climate_api(lat, lon, area))
    
    if not result:
        print("\nTest incomplete - examine the response structure and update power_api.py accordingly.")
    else:
        print("\nTest succeeded.") 