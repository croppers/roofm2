import { polygon } from '@turf/helpers';
import area from '@turf/area';
import centroid from '@turf/centroid';

/**
 * Calculate the area of a polygon (in square meters) from an array of lat/lng coordinates.
 */
export function calculateAreaSqMeters(coords: { lat: number; lng: number }[]): number {
  // Turf expects coordinates in [lng, lat]
  const turfCoords = coords.map(({ lat, lng }) => [lng, lat]);
  // Ensure the polygon ring is closed (first coords equals last coords)
  const closedCoords = [...turfCoords];
  const first = turfCoords[0];
  const last = turfCoords[turfCoords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closedCoords.push(first);
  }
  const poly = polygon([closedCoords]);
  return area(poly);
}

/**
 * Calculate the centroid of a polygon.
 */
export function getPolygonCentroid(coords: { lat: number; lng: number }[]): { lat: number; lng: number } {
  const turfCoords = coords.map(({ lat, lng }) => [lng, lat]);
  const closedCoords = [...turfCoords];
  const first = turfCoords[0];
  const last = turfCoords[turfCoords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closedCoords.push(first);
  }
  const poly = polygon([closedCoords]);
  const center = centroid(poly);
  return { lat: center.geometry.coordinates[1], lng: center.geometry.coordinates[0] };
} 