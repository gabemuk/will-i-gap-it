'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCarLabel } from '@/lib/compare';
import DidYouGapItForm from '@/components/DidYouGapItForm';
import type { SavedMatchup } from '@/lib/types';

type PageProps = {
  params: Promise<{ shareCode: string }>;
};

export default function MatchupPage({ params }: PageProps) {
  const { shareCode } = use(params);

  const [matchup, setMatchup] = useState<SavedMatchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMatchup() {
      const { data, error: dbError } = await supabase
        .from('matchups')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (dbError || !data) {
        setError('Matchup not found or could not be loaded.');
      } else {
        setMatchup(data as SavedMatchup);
      }
      setLoading(false);
    }

    fetchMatchup();
  }, [shareCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading matchup...</p>
      </main>
    );
  }

  if (error || !matchup) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Link href="/" className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors">
            Will I Gap It?
          </Link>
          <p className="text-red-400 mt-8 mb-6 text-sm">
            {error || 'Matchup not found.'}
          </p>
          <Link href="/" className="text-orange-500 hover:text-orange-400 underline text-sm">
            ← Back to calculator
          </Link>
        </div>
      </main>
    );
  }

  const carAName = getCarLabel(matchup.car_a) || 'Car A';
  const carBName = getCarLabel(matchup.car_b) || 'Car B';
  const { prediction } = matchup;

  const winnerLabel =
    prediction.winner === 'Car A'
      ? carAName
      : prediction.winner === 'Car B'
      ? carBName
      : null;

  const confidenceColor =
    prediction.confidence === 'High'
      ? 'text-green-400'
      : prediction.confidence === 'Medium'
      ? 'text-orange-400'
      : 'text-yellow-400';

  const raceTypeDisplay =
    matchup.race_type.charAt(0).toUpperCase() + matchup.race_type.slice(1);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors"
          >
            Will I Gap It?
          </Link>
          <p className="text-zinc-600 text-xs mt-1">
            Closed-course matchup · {raceTypeDisplay} Race
          </p>
        </div>

        {/* Matchup title */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4 text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
            {raceTypeDisplay} Race
          </p>
          <p className="text-2xl font-bold">
            <span className="text-orange-500">{carAName}</span>
            <span className="text-zinc-600 mx-3">vs</span>
            <span className="text-orange-400">{carBName}</span>
          </p>
        </div>

        {/* Car cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: 'Car A', car: matchup.car_a, name: carAName, accent: 'text-orange-500' },
            { label: 'Car B', car: matchup.car_b, name: carBName, accent: 'text-orange-400' },
          ].map(({ label, car, name, accent }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${accent}`}>
                {label}
              </p>
              <p className="text-sm font-semibold text-white mb-3 leading-snug">{name}</p>
              <div className="space-y-1 text-xs text-zinc-400">
                <p>
                  {car.horsepower} {car.powerType}
                </p>
                <p>
                  {car.weight} lbs · {car.drivetrain}
                </p>
                <p>
                  {car.transmission} · {car.tire}
                </p>
                {car.aspiration && car.aspiration !== 'Unknown' && (
                  <p>{car.aspiration}</p>
                )}
                {car.mods && (
                  <p className="text-zinc-500 italic pt-1 border-t border-zinc-800">
                    {car.mods}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Prediction card */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-5">
            Estimated Result
          </h3>

          {/* Winner */}
          <div className="mb-6">
            <p className="text-xs text-zinc-500 mb-1">
              {prediction.winner === 'Too close' ? 'Verdict' : 'Likely winner'}
            </p>
            {prediction.winner === 'Too close' ? (
              <p className="text-3xl font-bold text-yellow-400">Too Close to Call</p>
            ) : (
              <p className="text-3xl font-bold text-orange-500">
                {prediction.winner} —{' '}
                <span className="text-white">{winnerLabel}</span>
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Estimated Gap</p>
              <p className="text-sm font-semibold text-white leading-snug">
                {prediction.estimatedGap}
              </p>
            </div>
            <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
              <p className="text-xs text-zinc-500 mb-1">Confidence</p>
              <p className={`text-sm font-bold ${confidenceColor}`}>
                {prediction.confidence}
              </p>
            </div>
          </div>

          {/* Analysis */}
          <div className="mb-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Analysis</p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {prediction.explanation}
            </p>
          </div>

          {/* To close the gap */}
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
              To Close the Gap
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {prediction.neededAdvantage}
            </p>
          </div>
        </div>

        {/* Did You Gap It? */}
        <DidYouGapItForm
          matchupId={matchup.id}
          predictedWinner={prediction.winner}
          carAName={carAName}
          carBName={carBName}
        />

        {/* Disclaimer */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          For closed-course and track comparison only. Results are estimates and
          do not guarantee real-world outcomes.
        </p>
      </div>
    </main>
  );
}
