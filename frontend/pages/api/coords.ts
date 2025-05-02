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

  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ detail: 'Address is required' });
  }

  try {
    // Forward request to backend
    const response = await fetch(
      `${BACKEND_URL}/api/geocode?address=${encodeURIComponent(address as string)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error geocoding address:', error);
    return res.status(500).json({ detail: 'Failed to geocode address' });
  }
} 