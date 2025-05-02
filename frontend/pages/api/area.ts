import type { NextApiRequest, NextApiResponse } from 'next';

// Backend URL (would come from env in production)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const { lat, lon, zoom } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ detail: 'Latitude and longitude are required' });
  }

  try {
    // Forward request to backend
    const url = new URL(`${BACKEND_URL}/api/area`);
    url.searchParams.append('lat', lat as string);
    url.searchParams.append('lon', lon as string);
    if (zoom) url.searchParams.append('zoom', zoom as string);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calculating roof area:', error);
    return res.status(500).json({ detail: 'Failed to calculate roof area' });
  }
} 