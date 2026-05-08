'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';
import { supabase } from '@/lib/supabase';
import { getCarLabel } from '@/lib/compare';
import {
  formatRaceType,
  formatProofType,
  formatDate,
  formatVerificationStatus,
  getVerificationBadgeClass,
} from '@/lib/format';
import type { ResultWithMatchup } from '@/lib/types';

function PredictionBadge({ correct }: { correct: boolean | null }) {
  if (correct === null) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-400">
        Not Available
      </span>
    );
  }
  return correct ? (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-900/60 text-green-400 border border-green-700/40">
      Correct Prediction
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-900/40 text-red-400 border border-red-700/40">
      Missed Prediction
    </span>
  );
}

function ResultEntry({ result }: { result: ResultWithMatchup }) {
  const matchup = result.matchups;

  const carALabel = matchup ? (getCarLabel(matchup.car_a) || 'Car A') : 'Car A';
  const carBLabel = matchup ? (getCarLabel(matchup.car_b) || 'Car B') : 'Car B';

  const predictedWinner =
    matchup?.prediction.winner === 'Car A'
      ? carALabel
      : matchup?.prediction.winner === 'Car B'
      ? carBLabel
      : matchup?.prediction.winner === 'Too close'
      ? 'Too Close to Call'
      : '—';

  const raceType = matchup?.race_type ? formatRaceType(matchup.race_type) : '—';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-2">
            {raceType}
          </span>
          <p className="text-base font-bold text-white leading-snug">
            <span className="text-orange-500">{carALabel}</span>
            <span className="text-zinc-600 mx-2">vs</span>
            <span className="text-orange-400">{carBLabel}</span>
          </p>
        </div>
        <PredictionBadge correct={result.prediction_was_correct} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-1">Predicted Winner</p>
          <p className="text-sm font-semibold text-zinc-200 leading-snug">{predictedWinner}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-1">Actual Winner</p>
          <p className="text-sm font-semibold text-white leading-snug">{result.actual_winner}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-1">Actual Gap</p>
          <p className="text-sm font-semibold text-white">{result.actual_gap}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3">
          <p className="text-xs text-zinc-500 mb-1">Proof</p>
          <p className="text-sm font-semibold text-zinc-300">{formatProofType(result.proof_type)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getVerificationBadgeClass(result.verification_status)}`}
        >
          {formatVerificationStatus(result.verification_status)}
        </span>
        {result.proof_url && (
          <a
            href={result.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            View proof
          </a>
        )}
      </div>

      {result.result_notes && (
        <p className="text-xs text-zinc-400 italic mb-3 border-l-2 border-zinc-700 pl-3">
          {result.result_notes}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-600">{formatDate(result.created_at)}</p>
        {matchup?.share_code && (
          <Link
            href={`/matchup/${matchup.share_code}`}
            className="text-xs text-orange-500 hover:text-orange-400 transition-colors underline underline-offset-2"
          >
            View original matchup
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultWithMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResults() {
      const { data, error: dbError } = await supabase
        .from('race_results')
        .select(`
          id,
          matchup_id,
          actual_winner,
          actual_gap,
          result_notes,
          proof_type,
          proof_url,
          verification_status,
          prediction_was_correct,
          created_at,
          matchups (
            share_code,
            car_a,
            car_b,
            race_type,
            prediction
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbError) {
        setError('Could not load results. Please try again later.');
      } else {
        setResults((data ?? []) as unknown as ResultWithMatchup[]);
      }
      setLoading(false);
    }
    fetchResults();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <Link href="/" className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors">
            Will I Gap It?
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-white mt-4 mb-1">
            Recent Results
          </h1>
          <p className="text-zinc-400 text-sm mb-2">
            Submitted closed-course matchup outcomes.
          </p>
          <p className="text-zinc-600 text-xs">
            Results are user-submitted and may be unverified.
          </p>
        </div>

        <div className="flex gap-3 mb-8 justify-center flex-wrap items-center">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Back to Calculator
          </Link>
          <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-default">
            Recent Results
          </span>
          <Link href="/leaderboard" className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Leaderboard
          </Link>
          <AuthNav />
        </div>

        {loading && (
          <div className="text-center py-20">
            <p className="text-zinc-500 animate-pulse">Loading results...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-950/60 border border-red-700/60 rounded-xl p-5 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-zinc-400 text-base font-semibold mb-2">No results yet.</p>
            <p className="text-zinc-600 text-sm mb-6">
              Be the first to submit a closed-course matchup outcome.
            </p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm">
              Go to Calculator
            </Link>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <ResultEntry key={result.id} result={result} />
            ))}
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
