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

    console.log("Raw NASA POWER data:", JSON.stringify(data, null, 2));

    // Map NASA POWER month keys (JAN, FEB...) to numbers (1, 2...)
    const mapKeysToNumbers = (obj: Record<string, number> | undefined): Record<string, number> => {
      if (!obj) return {};
      const monthMap: { [key: string]: number } = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
      const result: Record<string, number> = {};
      for (const key in obj) {
        if (monthMap[key]) {
          result[String(monthMap[key])] = obj[key];
        }
      }
      return result;
    };

    const solarRaw = data.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    const precipRaw = data.properties?.parameter?.PRECTOTCORR;

    console.log("Extracted Precip Raw:", precipRaw);

    const monthlySolar = mapKeysToNumbers(solarRaw);
    const monthlyPrecip = mapKeysToNumbers(precipRaw);

    console.log("Mapped Precip:", monthlyPrecip);

    return res.status(200).json({ solar: monthlySolar, precipitation: monthlyPrecip });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
} 