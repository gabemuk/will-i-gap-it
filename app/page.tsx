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

    const { data: { user } } = await supabase.auth.getUser();

    const baseMatchupPayload = {
      share_code: shareCode,
      car_a: carA,
      car_b: carB,
      race_type: raceType,
      prediction: result,
      user_id: user?.id ?? null,
    };

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
      ? 'px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-[var(--color-accent)] text-white'
      : 'px-4 py-2 rounded-lg text-sm font-medium transition-all text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell variant="light">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="text-center py-14 sm:py-20">
        <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-accent-dim)] border border-[rgba(249,115,22,0.25)] text-[var(--color-accent)] text-xs font-semibold tracking-widest uppercase mb-6">
          Closed-Course Only
        </span>
        <h1 className="font-display font-bold text-5xl sm:text-7xl uppercase tracking-tight text-zinc-900 mb-4 leading-none">
          Will I Gap It?
        </h1>
        <p className="text-zinc-500 text-lg max-w-sm mx-auto mb-2">
          Enter two builds. Choose the race. Get the estimated gap.
        </p>
        <p className="text-zinc-400 text-sm mb-10">
          Closed-course and track comparison only.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="#compare"
            className="inline-block px-7 py-3 bg-[var(--color-accent)] hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-sm"
          >
            Compare Builds
          </a>
          <Link
            href="/leaderboard"
            className="inline-block px-7 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold rounded-xl transition-colors text-sm"
          >
            View Leaderboard
          </Link>
        </div>
      </section>

      {/* ── Calculator — light comparison surface with orange identity rail ── */}
      <div
        id="compare"
        className="bg-white border border-zinc-200 border-t-2 border-t-orange-500 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.07)] px-5 sm:px-8 py-8"
      >

        {/* Calculator title */}
        <div className="mb-5 pb-5 border-b border-zinc-100">
          <p className="font-display font-bold text-xs uppercase tracking-widest text-zinc-500">
            Build Comparison
          </p>
          <p className="text-zinc-400 text-xs mt-0.5">
            Set up both cars, choose a race format, then compare.
          </p>
        </div>

        {/* Car A vs Car B rivalry header — updates reactively as user fills forms */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm uppercase tracking-widest text-[var(--color-accent)] leading-none">
              Car A
            </p>
            {nameA !== 'Car A' && (
              <p className="text-zinc-400 text-xs mt-1 truncate">{nameA}</p>
            )}
          </div>

          <div className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-zinc-800">
            <span className="font-display font-bold text-xs text-white tracking-widest">VS</span>
          </div>

          <div className="flex-1 min-w-0 text-right">
            <p className="font-display font-bold text-sm uppercase tracking-widest text-zinc-600 leading-none">
              Car B
            </p>
            {nameB !== 'Car B' && (
              <p className="text-zinc-400 text-xs mt-1 truncate">{nameB}</p>
            )}
          </div>
        </div>

        {/* Car input forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <CarInputForm label="Car A" value={carA} onChange={setCarA} />
          <CarInputForm label="Car B" value={carB} onChange={setCarB} />
        </div>

        {/* Race type — segmented control on zinc-100 track */}
        <div className="mb-6">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-3">
            Race Type
          </p>
          <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
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

        {/* Primary action */}
        <button
          onClick={handleCompare}
          className="w-full py-4 bg-[var(--color-accent)] hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all"
        >
          Compare Builds
        </button>

      </div>

      {/* ── Validation error ───────────────────────────────────────────────── */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Result — timing slip card on light page bg ─────────────────────── */}
      {result && (
        <div id="result-section" className="mt-6 space-y-3">
          <ResultCard result={result} carAName={nameA} carBName={nameB} />

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {saveError}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold rounded-xl transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving matchup...' : 'Save & Share This Matchup'}
          </button>
        </div>
      )}

      <p className="text-center text-zinc-400 text-xs mt-12">
        No real names, plates, or locations required.
      </p>

    </PageShell>
  );
}
