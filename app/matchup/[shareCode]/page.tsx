'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCarLabel } from '@/lib/compare';
import DidYouGapItForm from '@/components/DidYouGapItForm';
import SubmittedResultCard from '@/components/SubmittedResultCard';
import FlagResultForm from '@/components/FlagResultForm';
import ResultCard from '@/components/ResultCard';
import PageShell from '@/components/PageShell';
import type { SavedMatchup, RaceResult } from '@/lib/types';
import { buildProfileMap, collectUserIds, getSubmitterName } from '@/lib/profileDisplay';

type PageProps = {
  params: Promise<{ shareCode: string }>;
};

export default function MatchupPage({ params }: PageProps) {
  const { shareCode } = use(params);

  const [matchup, setMatchup] = useState<SavedMatchup | null>(null);
  const [existingResult, setExistingResult] = useState<RaceResult | null>(null);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
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

      // Second query: fetch display names for any user_ids present
      const userIds = collectUserIds([
        matchupData.user_id,
        resultData?.user_id,
      ]);
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);
        if (profileRows) {
          setProfileMap(buildProfileMap(profileRows));
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [shareCode]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell variant="light" maxWidth="max-w-2xl">
        <div className="flex items-center justify-center py-24">
          <p className="text-zinc-400 animate-pulse text-sm">Loading matchup…</p>
        </div>
      </PageShell>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────
  if (error || !matchup) {
    return (
      <PageShell variant="light" maxWidth="max-w-2xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-white border border-zinc-200 rounded-xl p-8 max-w-sm w-full">
            <p className="text-red-600 text-sm mb-4">{error || 'Matchup not found.'}</p>
            <Link
              href="/"
              className="text-orange-500 hover:text-orange-600 underline underline-offset-2 text-sm transition-colors"
            >
              Back to calculator
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const carAName = getCarLabel(matchup.car_a) || 'Car A';
  const carBName = getCarLabel(matchup.car_b) || 'Car B';
  const { prediction } = matchup;

  const raceTypeDisplay =
    matchup.race_type.charAt(0).toUpperCase() + matchup.race_type.slice(1);

  // ── Signed in ────────────────────────────────────────────────────────────
  return (
    <PageShell variant="light" maxWidth="max-w-2xl">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-zinc-900">
          Shared Matchup
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Closed-course prediction and submitted outcome.
        </p>
      </div>

      {/* ── Race header card ──────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {raceTypeDisplay} Race
          </span>
          <span className="font-mono text-[10px] text-zinc-400">{shareCode}</span>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight leading-none">
            <span className="text-[var(--color-accent)]">{carAName}</span>
            <span className="text-zinc-400 mx-3 font-normal text-xl">vs</span>
            <span className="text-zinc-700">{carBName}</span>
          </p>
          {matchup.user_id && (
            <p className="text-xs text-zinc-400 mt-2">
              Saved by{' '}
              <span className="text-zinc-600">{getSubmitterName(matchup.user_id, profileMap)}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Car A / Car B specs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {[
          {
            label: 'Car A',
            car: matchup.car_a,
            name: carAName,
            nameClass: 'text-[var(--color-accent)]',
            labelClass: 'text-[var(--color-accent)]',
          },
          {
            label: 'Car B',
            car: matchup.car_b,
            name: carBName,
            nameClass: 'text-zinc-700',
            labelClass: 'text-zinc-500',
          },
        ].map(({ label, car, name, nameClass, labelClass }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className={`font-display text-[10px] font-bold uppercase tracking-widest mb-1.5 ${labelClass}`}>
              {label}
            </p>
            <p className={`text-sm font-display font-bold mb-3 leading-snug ${nameClass}`}>{name}</p>
            <div className="space-y-1 text-xs text-zinc-500">
              <p>
                <span className="font-mono">{car.horsepower}</span> {car.powerType}
              </p>
              <p>
                <span className="font-mono">{car.weight}</span> lbs &middot; {car.drivetrain}
              </p>
              <p>{car.transmission} &middot; {car.tire}</p>
              {car.aspiration && car.aspiration !== 'Unknown' && (
                <p>{car.aspiration}</p>
              )}
              {car.mods && (
                <p className="text-zinc-400 italic pt-1.5 border-t border-zinc-100">
                  {car.mods}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Estimated result (ResultCard is already a white light card) ───── */}
      <div className="mb-5">
        <ResultCard result={prediction} carAName={carAName} carBName={carBName} />
      </div>

      {/* ── Submitted result or "Did You Gap It?" form ────────────────────── */}
      <div className="mb-5">
        {existingResult ? (
          <>
            <SubmittedResultCard
              result={existingResult}
              carAName={carAName}
              carBName={carBName}
              submitterName={getSubmitterName(existingResult.user_id, profileMap)}
            />
            <div className="mt-3">
              <FlagResultForm raceResultId={existingResult.id} />
            </div>
          </>
        ) : (
          <DidYouGapItForm
            matchupId={matchup.id}
            predictedWinner={prediction.winner}
            carAName={carAName}
            carBName={carBName}
          />
        )}
      </div>

      {/* ── Bottom nav ────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex-1 text-center py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-orange-500 hover:text-orange-500 transition-colors"
        >
          Back to Calculator
        </Link>
        <Link
          href="/results"
          className="flex-1 text-center py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-zinc-400 hover:text-zinc-800 transition-colors"
        >
          View Recent Results
        </Link>
      </div>

    </PageShell>
  );
}
