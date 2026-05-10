'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';
import { supabase } from '@/lib/supabase';
import { getCarLabel } from '@/lib/compare';
import DidYouGapItForm from '@/components/DidYouGapItForm';
import SubmittedResultCard from '@/components/SubmittedResultCard';
import FlagResultForm from '@/components/FlagResultForm';
import type { SavedMatchup, RaceResult } from '@/lib/types';

type PageProps = {
  params: Promise<{ shareCode: string }>;
};

export default function MatchupPage({ params }: PageProps) {
  const { shareCode } = use(params);

  const [matchup, setMatchup] = useState<SavedMatchup | null>(null);
  const [existingResult, setExistingResult] = useState<RaceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data: matchupData, error: matchupError } = await supabase
        .from('matchups')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (matchupError || !matchupData) {
        setError('Matchup not found or could not be loaded.');
        setLoading(false);
        return;
      }

      const loaded = matchupData as SavedMatchup;
      setMatchup(loaded);

      const { data: resultData } = await supabase
        .from('race_results')
        .select('*')
        .eq('matchup_id', loaded.id)
        .maybeSingle();

      if (resultData) {
        setExistingResult(resultData as RaceResult);
      }

      setLoading(false);
    }

    fetchData();
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
            Back to calculator
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

        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors"
          >
            Will I Gap It?
          </Link>
          <p className="text-zinc-600 text-xs mt-1">
            Closed-course matchup &middot; {raceTypeDisplay} Race
          </p>
        </div>

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
                  {car.weight} lbs &middot; {car.drivetrain}
                </p>
                <p>
                  {car.transmission} &middot; {car.tire}
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

        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-5">
            Estimated Result
          </h3>

          <div className="mb-6">
            <p className="text-xs text-zinc-500 mb-1">
              {prediction.winner === 'Too close' ? 'Verdict' : 'Likely winner'}
            </p>
            {prediction.winner === 'Too close' ? (
              <p className="text-3xl font-bold text-yellow-400">Too Close to Call</p>
            ) : (
              <p className="text-3xl font-bold text-orange-500">
                {prediction.winner} &mdash;{' '}
                <span className="text-white">{winnerLabel}</span>
              </p>
            )}
          </div>

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

          <div className="mb-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Analysis</p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {prediction.explanation}
            </p>
          </div>

          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
              To Close the Gap
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {prediction.neededAdvantage}
            </p>
          </div>
        </div>

        {existingResult ? (
          <>
            <SubmittedResultCard
              result={existingResult}
              carAName={carAName}
              carBName={carBName}
            />
            <FlagResultForm raceResultId={existingResult.id} />
          </>
        ) : (
          <DidYouGapItForm
            matchupId={matchup.id}
            predictedWinner={prediction.winner}
            carAName={carAName}
            carBName={carBName}
          />
        )}

        <div className="flex gap-3 mt-6">
          <Link
            href="/"
            className="flex-1 text-center py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-orange-500 hover:text-orange-400 transition-colors"
          >
            Back to Calculator
          </Link>
          <Link
            href="/results"
            className="flex-1 text-center py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View Recent Results
          </Link>
        </div>
        <div className="flex justify-center mt-3">
          <AuthNav />
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          For closed-course and track comparison only. Results are estimates and
          do not guarantee real-world outcomes.
        </p>
      </div>
    </main>
  );
}
