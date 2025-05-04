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
    <button 
      onClick={toggleUnits} 
      className="w-3/4 mx-auto px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm font-medium"
    >
      {units === 'metric' ? 'Show ft²' : 'Show m²'}
    </button>
  );
} 