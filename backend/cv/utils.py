import cv2
import numpy as np
import math
from typing import Tuple, List

def calculate_meters_per_pixel(lat: float, zoom: int) -> float:
    """
    Calculate the meters per pixel ratio based on latitude and zoom level.
    Formula from Google Maps documentation: 156543.03392 * cos(lat) / 2^zoom
    
    Args:
        lat: Latitude in decimal degrees
        zoom: Zoom level (typically 20 for max zoom)
        
    Returns:
        Float representing meters per pixel
    """
    return 156543.03392 * math.cos(math.radians(lat)) / (2 ** zoom)

def process_satellite_image(image_bytes: bytes) -> Tuple[float, List[List[int]]]:
    """
    Process a satellite image to find the largest roof contour.
    
    Args:
        image_bytes: Raw image bytes from Google Static Maps API
        
    Returns:
        Tuple containing:
        - Area in pixels
        - List of contour points
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply Canny edge detection
    edges = cv2.Canny(blurred, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # If no contours found, return 0 area and empty contour
    if not contours:
        return 0, []
    
    # Find the largest contour by area
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Apply convex hull to the largest contour
    hull = cv2.convexHull(largest_contour)
    
    # Calculate area in pixels
    area_px = cv2.contourArea(hull)
    
    # Convert contour points to a simple list for JSON serialization
    contour_points = hull.reshape(-1, 2).tolist()
    
    return area_px, contour_points

def calculate_real_area(area_px: float, meters_per_pixel: float) -> Tuple[float, float]:
    """
    Convert pixel area to real-world area in square meters and square feet.
    
    Args:
        area_px: Area in pixels
        meters_per_pixel: Conversion ratio from pixels to meters
        
    Returns:
        Tuple containing:
        - Area in square meters
        - Area in square feet
    """
    # Calculate area in square meters
    area_m2 = area_px * (meters_per_pixel ** 2)
    
    # Convert to square feet (1 m² = 10.7639 ft²)
    area_ft2 = area_m2 * 10.7639
    
    return area_m2, area_ft2 