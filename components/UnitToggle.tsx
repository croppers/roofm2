'use client';
import { useSearchParams, useRouter } from 'next/navigation';

export default function UnitToggle() {
  const searchParams = useSearchParams()!;
  const router = useRouter();
  const units = searchParams.get('units') === 'imperial' ? 'imperial' : 'metric';

  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    const params = new URLSearchParams(searchParams.toString());
    params.set('units', newUnits);
    router.push(`?${params.toString()}`);
  };

  return (
    <button onClick={toggleUnits} className="btn-secondary text-xs sm:text-sm">
      {units === 'metric' ? 'Show ft²' : 'Show m²'}
    </button>
  );
}
