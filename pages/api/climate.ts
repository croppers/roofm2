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

    // NASA POWER may return data under properties.parameter or parameters
    const paramContainer = data.properties?.parameter ?? data.parameters;

    // Map NASA POWER month abbreviations to numeric month keys
    const monthKeyMap: Record<string,string> = { JAN:'1', FEB:'2', MAR:'3', APR:'4', MAY:'5', JUN:'6', JUL:'7', AUG:'8', SEP:'9', OCT:'10', NOV:'11', DEC:'12' };
    const solarRaw = paramContainer?.ALLSKY_SFC_SW_DWN || {};
    const precipRaw = paramContainer?.PRECTOT || {};
    const monthlySolar: Record<string, number> = {};
    const monthlyPrecip: Record<string, number> = {};
    for (const [abbr, val] of Object.entries(solarRaw)) {
      const key = monthKeyMap[abbr.toUpperCase()];
      if (key) monthlySolar[key] = val as number;
    }
    for (const [abbr, val] of Object.entries(precipRaw)) {
      const key = monthKeyMap[abbr.toUpperCase()];
      if (key) monthlyPrecip[key] = val as number;
    }

    return res.status(200).json({ solar: monthlySolar, precipitation: monthlyPrecip });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
} 