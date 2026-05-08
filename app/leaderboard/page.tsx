'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  formatRaceType,
  formatProofType,
  formatDate,
  formatVerificationStatus,
  getVerificationBadgeClass,
} from '@/lib/format';
import { buildLeaderboards } from '@/lib/leaderboard';
import type { ResultWithMatchup } from '@/lib/types';
import type { LeaderboardData } from '@/lib/leaderboard';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-black text-orange-500 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MostWinsSection({ data }: { data: LeaderboardData }) {
  if (data.mostWins.length === 0) {
    return (
      <Section title="Most Reported Wins">
        <p className="text-zinc-500 text-sm">No win data yet.</p>
      </Section>
    );
  }
  return (
    <Section title="Most Reported Wins">
      <p className="text-xs text-zinc-600 mb-3 -mt-1">
        Similar builds are grouped using normalized year/make/model/trim data.
      </p>
      <div className="space-y-2">
        {data.mostWins.map((entry, i) => (
          <div key={entry.buildKey} className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-3">
            <span className="text-lg font-black text-zinc-500 w-7 shrink-0">
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{entry.displayLabel}</p>
              {entry.latestRaceType && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  Latest: {formatRaceType(entry.latestRaceType)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-black text-orange-400">
                {entry.wins} {entry.wins === 1 ? 'win' : 'wins'}
              </span>
              {entry.latestShareCode && (
                <Link
                  href={`/matchup/${entry.latestShareCode}`}
                  className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
                >
                  View
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PredictionsSection({ data }: { data: LeaderboardData }) {
  const { predictionAccuracy, recentCorrect } = data;
  return (
    <Section title="Most Correct Predictions">
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-zinc-800/60 rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-green-400">{predictionAccuracy.correct}</p>
          <p className="text-xs text-zinc-500 mt-1">Correct</p>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-red-400">{predictionAccuracy.missed}</p>
          <p className="text-xs text-zinc-500 mt-1">Missed</p>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-orange-400">{predictionAccuracy.percentage}%</p>
          <p className="text-xs text-zinc-500 mt-1">Accuracy</p>
        </div>
      </div>

      {recentCorrect.length === 0 ? (
        <p className="text-zinc-500 text-sm">No verified correct predictions yet.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Recent Correct Predictions</p>
          {recentCorrect.map((entry, i) => (
            <div key={i} className="bg-zinc-800/50 rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-snug truncate">
                    <span className="text-orange-500">{entry.carALabel}</span>
                    <span className="text-zinc-600 mx-1.5">vs</span>
                    <span className="text-orange-400">{entry.carBLabel}</span>
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    <p className="text-xs text-zinc-500">
                      Predicted: <span className="text-green-400">{entry.predictedWinner}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      Actual: <span className="text-zinc-300">{entry.actualWinner}</span>
                    </p>
                    <p className="text-xs text-zinc-500">{formatRaceType(entry.raceType)}</p>
                  </div>
                  <div className="mt-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getVerificationBadgeClass(entry.verificationStatus)}`}>
                      {formatVerificationStatus(entry.verificationStatus)}
                    </span>
                  </div>
                </div>
                {entry.shareCode && (
                  <Link
                    href={`/matchup/${entry.shareCode}`}
                    className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2 shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function BiggestGapsSection({ data }: { data: LeaderboardData }) {
  if (data.biggestGaps.length === 0) {
    return (
      <Section title="Biggest Reported Gaps">
        <p className="text-zinc-500 text-sm">No gap data yet.</p>
      </Section>
    );
  }
  return (
    <Section title="Biggest Reported Gaps">
      <div className="space-y-2">
        {data.biggestGaps.map((entry, i) => (
          <div key={i} className="bg-zinc-800/50 rounded-lg px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-zinc-500">#{i + 1}</span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {entry.actualGap}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-1 leading-snug truncate">
                  <span className="text-orange-500">{entry.carALabel}</span>
                  <span className="text-zinc-600 mx-1.5">vs</span>
                  <span className="text-orange-400">{entry.carBLabel}</span>
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <p className="text-xs text-zinc-500">
                    Winner: <span className="text-zinc-300">{entry.actualWinner}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    Proof: <span className="text-zinc-400">{formatProofType(entry.proofType)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getVerificationBadgeClass(entry.verificationStatus)}`}>
                    {formatVerificationStatus(entry.verificationStatus)}
                  </span>
                  {entry.proofUrl && (
                    <a
                      href={entry.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                      View proof
                    </a>
                  )}
                </div>
              </div>
              {entry.shareCode && (
                <Link
                  href={`/matchup/${entry.shareCode}`}
                  className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2 shrink-0"
                >
                  View
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ActivitySection({ data }: { data: LeaderboardData }) {
  const raceTypeLabels: { key: keyof typeof data.raceTypeCounts; label: string }[] = [
    { key: 'dig', label: 'Dig' },
    { key: '40 roll', label: '40 Roll' },
    { key: '60 roll', label: '60 Roll' },
    { key: '60-130', label: '60-130' },
    { key: 'quarter mile', label: 'Quarter Mile' },
  ];
  const maxCount = Math.max(...Object.values(data.raceTypeCounts), 1);
  return (
    <Section title="Most Active Race Types">
      <div className="mb-4">
        <p className="text-3xl font-black text-white">
          {data.totalResults}
          <span className="text-base font-semibold text-zinc-400 ml-2">total submitted results</span>
        </p>
      </div>
      <div className="space-y-2">
        {raceTypeLabels.map(({ key, label }) => {
          const count = data.raceTypeCounts[key];
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-24 shrink-0">{label}</span>
              <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-bold text-zinc-300 w-6 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
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
        .limit(200);

      if (dbError) {
        setError('Could not load leaderboard data. Please try again later.');
      } else {
        const results = (data ?? []) as unknown as ResultWithMatchup[];
        setLeaderboard(buildLeaderboards(results));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const isEmpty =
    leaderboard !== null &&
    leaderboard.totalResults === 0 &&
    leaderboard.mostWins.length === 0;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <Link href="/" className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors">
            Will I Gap It?
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-white mt-4 mb-1">
            Leaderboard
          </h1>
          <p className="text-zinc-400 text-sm mb-1">
            Top submitted closed-course matchup outcomes.
          </p>
          <p className="text-zinc-600 text-xs">
            Rankings are based on user-submitted results and may be unverified.
          </p>
        </div>

        <div className="flex gap-3 mb-8 justify-center flex-wrap">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Calculator
          </Link>
          <Link href="/results" className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Recent Results
          </Link>
          <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-default">
            Leaderboard
          </span>
        </div>

        {loading && (
          <div className="text-center py-20">
            <p className="text-zinc-500 animate-pulse">Loading leaderboard...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-950/60 border border-red-700/60 rounded-xl p-5 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && isEmpty && (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-zinc-400 text-base font-semibold mb-2">No leaderboard data yet.</p>
            <p className="text-zinc-600 text-sm mb-6 px-6">
              Submit actual results from saved matchups to start ranking builds.
            </p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm">
              Go to Calculator
            </Link>
          </div>
        )}

        {!loading && !error && leaderboard && !isEmpty && (
          <>
            <ActivitySection data={leaderboard} />
            <MostWinsSection data={leaderboard} />
            <PredictionsSection data={leaderboard} />
            <BiggestGapsSection data={leaderboard} />
          </>
        )}

        <p className="text-center text-zinc-600 text-xs mt-6">
          For closed-course and track comparison only. Results are estimates and
          do not guarantee real-world outcomes.
        </p>

      </div>
    </main>
  );
}
