'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CarInputForm from '@/components/CarInputForm';
import ResultCard from '@/components/ResultCard';
import PageShell from '@/components/PageShell';
import { CarInput, CompareResult, RaceType } from '@/lib/types';
import { compareCars, getCarLabel } from '@/lib/compare';
import { supabase } from '@/lib/supabase';
import { generateShareCode } from '@/lib/shareCode';
import { getBuildKey } from '@/lib/normalize';

// ── Constants ────────────────────────────────────────────────────────────────

const RACE_TYPES: RaceType[] = ['dig', '40 roll', '60 roll', '60-130', 'quarter mile'];

const MIN_YEAR = 1886;
const MAX_YEAR = new Date().getFullYear() + 1;

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    transmission: 'Unknown',
    tire: 'Summer',
    zeroToSixty: '',
    sixtyToOneThirty: '',
    quarterMile: '',
    trapSpeed: '',
    mods: '',
    powertrainType: 'Unknown',
    engineSize: '',
    electricMotorCount: 'Unknown',
    hybridLayout: 'Unknown',
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  // All state and logic below is UNCHANGED from the previous version.
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

    // Attach user_id if logged in; anonymous saves still work (user_id = null)
    const { data: { user } } = await supabase.auth.getUser();

    // ── Base payload (always safe, works before migration) ─────────────────
    const baseMatchupPayload = {
      share_code: shareCode,
      car_a: carA,
      car_b: carB,
      race_type: raceType,
      prediction: result,
      user_id: user?.id ?? null,
    };

    // ── Extended payload with build keys (added in learning_foundation) ────
    const extendedMatchupPayload = {
      ...baseMatchupPayload,
      car_a_build_key:    getBuildKey(carA),
      car_b_build_key:    getBuildKey(carB),
      prediction_version: 'v1',
    };

    const { error: dbError } = await supabase
      .from('matchups')
      .insert(extendedMatchupPayload);

    if (dbError) {
      const isMissingColumn =
        dbError.code === '42703' ||
        (typeof dbError.message === 'string' &&
          (dbError.message.toLowerCase().includes('column') ||
           dbError.message.toLowerCase().includes('does not exist')));

      if (isMissingColumn) {
        console.warn(
          'Build key columns missing; retrying matchup insert without build keys.',
          dbError
        );
        const { error: fallbackError } = await supabase
          .from('matchups')
          .insert(baseMatchupPayload);

        if (fallbackError) {
          setSaveError('Could not save matchup. Check your Supabase connection and try again.');
          setSaving(false);
          return;
        }
      } else {
        setSaveError('Could not save matchup. Check your Supabase connection and try again.');
        setSaving(false);
        return;
      }
    }

    router.push(`/matchup/${shareCode}`);
  }

  const nameA = getCarLabel(carA) || 'Car A';
  const nameB = getCarLabel(carB) || 'Car B';

  const raceBtnClass = (rt: RaceType) =>
    rt === raceType
      ? 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-orange-500 text-white'
      : 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/60';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="text-center pt-6 pb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-widest uppercase mb-5">
          Closed-Course Only
        </span>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-3 leading-none">
          Will I Gap It?
        </h1>
        <p className="text-zinc-400 text-lg mb-2">
          Compare two builds. Pick the race. Get the estimated gap.
        </p>
        <p className="text-zinc-600 text-sm mb-8">
          Closed-course and track comparison only.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="#compare"
            className="inline-block px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl transition-colors text-sm shadow-[0_2px_14px_rgba(249,115,22,0.28)]"
          >
            Compare Builds
          </a>
          <Link
            href="/leaderboard"
            className="inline-block px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-200 font-semibold rounded-xl transition-colors text-sm"
          >
            View Leaderboard
          </Link>
        </div>
      </section>

      {/* ── Calculator ─────────────────────────────────────────────────────── */}
      <div id="compare">

        {/* Car input cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <CarInputForm label="Car A" value={carA} onChange={setCarA} />
          <CarInputForm label="Car B" value={carB} onChange={setCarB} />
        </div>

        {/* Race type picker */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800/80 rounded-xl p-5 mb-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Race Type
          </p>
          <div className="flex flex-wrap gap-2">
            {RACE_TYPES.map((rt) => (
              <button
                key={rt}
                onClick={() => setRaceType(rt)}
                className={raceBtnClass(rt)}
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
          Compare Builds
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
                {saving ? 'Saving matchup...' : 'Save & Share This Matchup'}
              </button>
            </div>
          </div>
        )}

      </div>

      <p className="text-center text-zinc-700 text-xs mt-12">
        No real names, plates, or locations required.
      </p>

    </PageShell>
  );
}
