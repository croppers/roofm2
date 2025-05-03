import type { NextApiRequest, NextApiResponse } from 'next';

const POWER_API_URL = process.env.CLIMATE_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { lat, lng } = req.query;
    if (!POWER_API_URL || Array.isArray(lat) || Array.isArray(lng)) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }
    const url = new URL(POWER_API_URL);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('parameters', 'ALLSKY_SFC_SW_DWN,PRECTOT');
    url.searchParams.set('community', 'RE');
    url.searchParams.set('format', 'JSON');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`NASA POWER responded ${response.status}`);
    }
    const data = await response.json();
    const monthlySolar = data.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    const monthlyPrecip = data.properties?.parameter?.PRECTOT;

    return res.status(200).json({ solar: monthlySolar, precipitation: monthlyPrecip });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
} 