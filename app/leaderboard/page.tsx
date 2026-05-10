'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';
import { supabase } from '@/lib/supabase';
import {
  formatRaceType,
  formatProofType,
  formatDate,
  formatVerificationStatus,
  getVerificationBadgeClass,
} from '@/lib/format';
import { buildLeaderboards } from '@/lib/leaderboard';
import {
  resultMatchesRaceType,
  resultMatchesProofLevel,
  resultInTimeWindow,
  type RaceTypeFilter,
  type ProofLevelFilter,
  type TimeWindowFilter,
} from '@/lib/resultFilters';
import type { ResultWithMatchup } from '@/lib/types';
import type { LeaderboardData, DriverEntry, WinEntry, ModelEntry } from '@/lib/leaderboard';
import FlagResultForm from '@/components/FlagResultForm';
import { buildProfileMap, collectUserIds, getSubmitterName } from '@/lib/profileDisplay';

// --- Section wrapper ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-black text-orange-500 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

// --- Leaderboard sections ---

function MostWinsSection({ data }: { data: LeaderboardData }) {
  if (data.mostWins.length === 0) {
    return (
      <Section title="Most Reported Wins">
        <p className="text-zinc-500 text-sm">No win data for these filters.</p>
      </Section>
    );
  }
  return (
    <Section title="Most Reported Wins">
      <p className="text-xs text-zinc-600 mb-3 -mt-1">Similar builds are grouped using normalized year/make/model/trim data.</p>
      <div className="space-y-2">
        {data.mostWins.map((entry, i) => (
          <div key={entry.buildKey} className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-3">
            <span className="text-lg font-black text-zinc-500 w-7 shrink-0">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{entry.displayLabel}</p>
              {entry.latestRaceType && (
                <p className="text-xs text-zinc-500 mt-0.5">Latest: {formatRaceType(entry.latestRaceType)}</p>
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

function PredictionsSection({ data, profileMap }: { data: LeaderboardData; profileMap: Map<string, string> }) {
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
        <p className="text-zinc-500 text-sm">No correct predictions for these filters.</p>
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
                    <p className="text-xs text-zinc-500">Predicted: <span className="text-green-400">{entry.predictedWinner}</span></p>
                    <p className="text-xs text-zinc-500">Actual: <span className="text-zinc-300">{entry.actualWinner}</span></p>
                    <p className="text-xs text-zinc-500">{formatRaceType(entry.raceType)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap mt-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getVerificationBadgeClass(entry.verificationStatus)}`}>
                      {formatVerificationStatus(entry.verificationStatus)}
                    </span>
                    <p className="text-xs text-zinc-600">
                      Submitted by{' '}
                      <span className="text-zinc-500">
                        {getSubmitterName(entry.userId, profileMap)}
                      </span>
                    </p>
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

function BiggestGapsSection({ data, profileMap }: { data: LeaderboardData; profileMap: Map<string, string> }) {
  if (data.biggestGaps.length === 0) {
    return (
      <Section title="Biggest Reported Gaps">
        <p className="text-zinc-500 text-sm">No gap data for these filters.</p>
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
                  <p className="text-xs text-zinc-500">Winner: <span className="text-zinc-300">{entry.actualWinner}</span></p>
                  <p className="text-xs text-zinc-500">Proof: <span className="text-zinc-400">{formatProofType(entry.proofType)}</span></p>
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
                  <p className="text-xs text-zinc-600">
                    Submitted by{' '}
                    <span className="text-zinc-500">
                      {getSubmitterName(entry.userId, profileMap)}
                    </span>
                  </p>
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
            <FlagResultForm raceResultId={entry.raceResultId} />
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

// --- Community leaderboards ---

function CommunityLeaderboardsSection({
  data,
  profileMap,
}: {
  data: LeaderboardData;
  profileMap: Map<string, string>;
}) {
  const topDrivers: DriverEntry[] = data.topDrivers;
  const topBuilds: WinEntry[] = data.topBuilds;
  const topModels: ModelEntry[] = data.topModels;

  return (
    <Section title="Community Leaderboards">
      {/* Top Drivers */}
      <div className="mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Top Drivers</p>
        {topDrivers.length === 0 ? (
          <p className="text-zinc-600 text-sm">No driver data for these filters.</p>
        ) : (
          <div className="space-y-1.5">
            {topDrivers.map((entry, i) => {
              const name = profileMap.get(entry.userId) || 'Anonymous';
              return (
                <div
                  key={entry.userId}
                  className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-2.5"
                >
                  <span className="text-sm font-black text-zinc-500 w-6 shrink-0">#{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-white truncate">{name}</span>
                  <span className="text-sm font-black text-orange-400 shrink-0">
                    {entry.wins} {entry.wins === 1 ? 'win' : 'wins'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Builds */}
      <div className="mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Top Builds</p>
        {topBuilds.length === 0 ? (
          <p className="text-zinc-600 text-sm">No build data for these filters.</p>
        ) : (
          <div className="space-y-1.5">
            {topBuilds.map((entry, i) => (
              <div
                key={entry.buildKey}
                className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-2.5"
              >
                <span className="text-sm font-black text-zinc-500 w-6 shrink-0">#{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-white truncate">{entry.displayLabel}</span>
                <span className="text-sm font-black text-orange-400 shrink-0">
                  {entry.wins} {entry.wins === 1 ? 'win' : 'wins'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Models */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Top Models</p>
        {topModels.length === 0 ? (
          <p className="text-zinc-600 text-sm">No model data for these filters.</p>
        ) : (
          <div className="space-y-1.5">
            {topModels.map((entry, i) => (
              <div
                key={entry.modelKey}
                className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-2.5"
              >
                <span className="text-sm font-black text-zinc-500 w-6 shrink-0">#{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-white truncate">{entry.displayLabel}</span>
                <span className="text-sm font-black text-orange-400 shrink-0">
                  {entry.wins} {entry.wins === 1 ? 'win' : 'wins'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// --- Filter panel ---

interface LeaderboardFilters {
  raceType: RaceTypeFilter;
  proofLevel: ProofLevelFilter;
  timeWindow: TimeWindowFilter;
}

const DEFAULT_FILTERS: LeaderboardFilters = {
  raceType: 'all',
  proofLevel: 'all',
  timeWindow: 'all',
};

const selectCls = 'bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer w-full';

interface LeaderboardFilterPanelProps {
  filters: LeaderboardFilters;
  onChange: (key: keyof LeaderboardFilters, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

function LeaderboardFilterPanel({ filters, onChange, onClear, hasActiveFilters }: LeaderboardFilterPanelProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Filter Results</span>
        {hasActiveFilters && (
          <button onClick={onClear} className="text-xs text-orange-500 hover:text-orange-400 font-semibold transition-colors">
            Clear filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={filters.raceType} onChange={(e) => onChange('raceType', e.target.value)} className={selectCls}>
          <option value="all">All Race Types</option>
          <option value="dig">Dig</option>
          <option value="40 roll">40 Roll</option>
          <option value="60 roll">60 Roll</option>
          <option value="60-130">60-130</option>
          <option value="quarter mile">Quarter Mile</option>
        </select>
        <select value={filters.proofLevel} onChange={(e) => onChange('proofLevel', e.target.value)} className={selectCls}>
          <option value="all">All Results</option>
          <option value="proof_linked_only">Proof Linked Only</option>
          <option value="proof_claimed_or_linked">Proof Claimed or Linked</option>
          <option value="exclude_disputed">Exclude Disputed</option>
        </select>
        <select value={filters.timeWindow} onChange={(e) => onChange('timeWindow', e.target.value)} className={selectCls}>
          <option value="all">All Time</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
      </div>
    </div>
  );
}

// --- Page ---

export default function LeaderboardPage() {
  const [rawResults, setRawResults] = useState<ResultWithMatchup[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<LeaderboardFilters>(DEFAULT_FILTERS);

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
          user_id,
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
        const rows = (data ?? []) as unknown as ResultWithMatchup[];
        setRawResults(rows);

        // Second query: fetch display names for submitters
        const userIds = collectUserIds(rows.map((r) => r.user_id));
        if (userIds.length > 0) {
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);
          if (profileRows) {
            setProfileMap(buildProfileMap(profileRows));
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  function handleFilterChange(key: keyof LeaderboardFilters, value: string) {
    setFilters((prev) => {
      const next = { ...prev };
      (next as Record<string, string>)[key] = value;
      return next;
    });
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const hasActiveFilters =
    filters.raceType !== 'all' ||
    filters.proofLevel !== 'all' ||
    filters.timeWindow !== 'all';

  const leaderboard = useMemo(() => {
    if (rawResults.length === 0) return null;
    const filtered = rawResults.filter(
      (r) =>
        resultMatchesRaceType(r, filters.raceType) &&
        resultMatchesProofLevel(r, filters.proofLevel) &&
        resultInTimeWindow(r, filters.timeWindow),
    );
    return buildLeaderboards(filtered);
  }, [rawResults, filters]);

  const hasNoData = rawResults.length === 0;
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
          <h1 className="text-4xl font-black tracking-tight text-white mt-4 mb-1">Leaderboard</h1>
          <p className="text-zinc-400 text-sm mb-1">Top submitted closed-course matchup outcomes.</p>
          <p className="text-zinc-600 text-xs">Rankings are based on user-submitted results and may be unverified.</p>
        </div>

        <div className="flex gap-3 mb-8 justify-center flex-wrap items-center">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Calculator
          </Link>
          <Link href="/results" className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Recent Results
          </Link>
          <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-default">
            Leaderboard
          </span>
          <AuthNav />
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

        {!loading && !error && hasNoData && (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-zinc-400 text-base font-semibold mb-2">No leaderboard data yet.</p>
            <p className="text-zinc-600 text-sm mb-6 px-6">Submit actual results from saved matchups to start ranking builds.</p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm">
              Go to Calculator
            </Link>
          </div>
        )}

        {!loading && !error && !hasNoData && (
          <>
            <LeaderboardFilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {isEmpty ? (
              <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
                <p className="text-zinc-400 text-base font-semibold mb-2">No results match these filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-sm text-orange-500 hover:text-orange-400 font-semibold transition-colors underline underline-offset-2"
                >
                  Clear filters
                </button>
              </div>
            ) : leaderboard ? (
              <>
                <ActivitySection data={leaderboard} />
                <CommunityLeaderboardsSection data={leaderboard} profileMap={profileMap} />
                <MostWinsSection data={leaderboard} />
                <PredictionsSection data={leaderboard} profileMap={profileMap} />
                <BiggestGapsSection data={leaderboard} profileMap={profileMap} />
              </>
            ) : null}
          </>
        )}

        <p className="text-center text-zinc-600 text-xs mt-6">
          For closed-course and track comparison only. Results are estimates and do not guarantee real-world outcomes.
        </p>

      </div>
    </main>
  );
}
