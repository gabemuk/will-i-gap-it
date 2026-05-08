'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CarInputForm from '@/components/CarInputForm';
import ResultCard from '@/components/ResultCard';
import { CarInput, CompareResult, RaceType } from '@/lib/types';
import { compareCars, getCarLabel } from '@/lib/compare';
import { supabase } from '@/lib/supabase';
import { generateShareCode } from '@/lib/shareCode';

const RACE_TYPES: RaceType[] = ['dig', '40 roll', '60 roll', '60-130', 'quarter mile'];

const MIN_YEAR = 1886;
const MAX_YEAR = new Date().getFullYear() + 1;

function defaultCar(): CarInput {
  return {
    make: '',
    model: '',
    year: '',
    trim: '',
    horsepower: '',
    powerType: 'Wheel HP',
    torque: '',
    weight: '',
    aspiration: 'Unknown',
    fuel: 'Unknown',
    drivetrain: 'RWD',
    transmission: 'Manual',
    tire: 'Summer',
    zeroToSixty: '',
    sixtyToOneThirty: '',
    quarterMile: '',
    trapSpeed: '',
    mods: '',
  };
}

function validateCar(car: CarInput, label: string): string | null {
  if (!car.make.trim()) return `${label}: Make is required.`;
  if (!car.model.trim()) return `${label}: Model is required.`;
  if (car.year === '') return `${label}: Year is required.`;
  const yr = Number(car.year);
  if (!Number.isInteger(yr) || yr < MIN_YEAR || yr > MAX_YEAR)
    return `${label}: Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`;
  if (car.horsepower === '' || Number(car.horsepower) <= 0)
    return `${label}: Horsepower must be greater than zero.`;
  if (car.weight === '' || Number(car.weight) <= 0)
    return `${label}: Weight must be greater than zero.`;
  return null;
}

export default function Home() {
  const router = useRouter();

  const [carA, setCarA] = useState<CarInput>(defaultCar());
  const [carB, setCarB] = useState<CarInput>(defaultCar());
  const [raceType, setRaceType] = useState<RaceType>('dig');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  function handleCompare() {
    const errA = validateCar(carA, 'Car A');
    if (errA) { setError(errA); setResult(null); return; }
    const errB = validateCar(carB, 'Car B');
    if (errB) { setError(errB); setResult(null); return; }
    setError('');
    setSaveError('');
    setResult(compareCars(carA, carB, raceType));
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setSaveError('');
    const shareCode = generateShareCode();
    const { error: dbError } = await supabase.from('matchups').insert({
      share_code: shareCode,
      car_a: carA,
      car_b: carB,
      race_type: raceType,
      prediction: result,
    });
    if (dbError) {
      setSaveError('Could not save matchup. Check your Supabase connection and try again.');
      setSaving(false);
      return;
    }
    router.push(`/matchup/${shareCode}`);
  }

  const nameA = getCarLabel(carA) || 'Car A';
  const nameB = getCarLabel(carB) || 'Car B';

  const btnClass = (rt: RaceType) =>
    rt === raceType
      ? 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-orange-500 text-white'
      : 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-zinc-800 text-zinc-300 hover:bg-zinc-700';

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tight text-orange-500 mb-2">
            Will I Gap It?
          </h1>
          <p className="text-zinc-400 text-lg">
            Closed-course car matchup calculator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <CarInputForm label="Car A" value={carA} onChange={setCarA} />
          <CarInputForm label="Car B" value={carB} onChange={setCarB} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
            Race Type
          </p>
          <div className="flex flex-wrap gap-2">
            {RACE_TYPES.map((rt) => (
              <button
                key={rt}
                onClick={() => setRaceType(rt)}
                className={btnClass(rt)}
              >
                {rt.charAt(0).toUpperCase() + rt.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCompare}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-lg rounded-xl transition-colors mb-5"
        >
          Compare Cars
        </button>

        {error && (
          <div className="bg-red-950/60 border border-red-700/60 rounded-xl p-4 mb-5 text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div id="result-section">
            <ResultCard result={result} carAName={nameA} carBName={nameB} />
            <div className="mt-4">
              {saveError && (
                <div className="bg-red-950/60 border border-red-700/60 rounded-xl p-4 mb-3 text-red-300 text-sm">
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl border border-zinc-700 transition-colors text-sm"
              >
                {saving ? 'Saving matchup...' : 'Save & Share This Matchup →'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs mt-10">
          For closed-course and track comparison only. Results are estimates and
          do not guarantee real-world outcomes.
        </p>

      </div>
    </main>
  );
}
