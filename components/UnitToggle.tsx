'use client';
import { useSearchParams, useRouter } from 'next/navigation';

export default function UnitToggle() {
  const searchParams = useSearchParams()!;
  const router = useRouter();
  const unitsParam = searchParams.get('units');
  const units = unitsParam === 'imperial' ? 'imperial' : 'metric';

  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    const params = new URLSearchParams(searchParams.toString());
    params.set('units', newUnits);
    router.push(`?${params.toString()}`);
  };

  return (
    <button onClick={toggleUnits} className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-sm">
      {units === 'metric' ? 'Show ft²' : 'Show m²'}
    </button>
  );
} 