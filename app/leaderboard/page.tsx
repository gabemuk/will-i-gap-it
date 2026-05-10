'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { supabase } from '@/lib/supabase';
import {
  formatRaceType,
  formatProofType,
  formatVerificationStatus,
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
import type { LeaderboardData } from '@/lib/leaderboard';
import FlagResultForm from '@/components/FlagResultForm';
import { buildProfileMap, collectUserIds, getSubmitterName } from '@/lib/profileDisplay';

// ── Local badge helper (light-theme) ─────────────────────────────────────────

function lightVerificationBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'proof_claimed':  return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'proof_linked':   return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'admin_verified': return 'bg-green-50 text-green-700 border border-green-200';
    case 'disputed':       return 'bg-red-50 text-red-700 border border-red-200';
    default:               return 'bg-zinc-100 text-zinc-500 border border-zinc-200';
  }
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'summary' | 'builds' | 'drivers' | 'results';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary'  },
  { id: 'builds',  label: 'Builds'   },
  { id: 'drivers', label: 'Drivers'  },
  { id: 'results', label: 'Results'  },
];

const INITIAL_SHOW = 5;

// ── Summary tab ───────────────────────────────────────────────────────────────

function SummaryTab({ data }: { data: LeaderboardData }) {
  const raceTypeLabels: { key: keyof typeof data.raceTypeCounts; label: string }[] = [
    { key: 'dig',          label: 'Dig'          },
    { key: '40 roll',      label: '40 Roll'      },
    { key: '60 roll',      label: '60 Roll'      },
    { key: '60-130',       label: '60-130'       },
    { key: 'quarter mile', label: 'Quarter Mile' },
  ];
  const maxCount = Math.max(...Object.values(data.raceTypeCounts), 1);
  const { predictionAccuracy } = data;

  return (
    <div className="space-y-4">
      {/* Race activity */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
          Race Activity
        </p>
        <p className="font-mono text-3xl font-bold text-zinc-900 leading-none mb-4">
          {data.totalResults}
          <span className="text-base font-sans font-normal text-zinc-400 ml-2">results submitted</span>
        </p>
        <div className="space-y-2.5">
          {raceTypeLabels.map(({ key, label }) => {
            const count = data.raceTypeCounts[key];
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-24 shrink-0">{label}</span>
                <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 bg-[var(--color-accent)] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-semibold text-zinc-700 w-5 text-right shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prediction accuracy */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
          Prediction Accuracy
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
            <p className="font-mono text-2xl font-bold text-green-700">{predictionAccuracy.correct}</p>
            <p className="text-xs text-green-600 mt-1">Correct</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
            <p className="font-mono text-2xl font-bold text-red-700">{predictionAccuracy.missed}</p>
            <p className="text-xs text-red-600 mt-1">Missed</p>
          </div>
          <div className="bg-[var(--color-accent-dim)] border border-orange-100 rounded-lg p-3 text-center">
            <p className="font-mono text-2xl font-bold text-[var(--color-accent)]">
              {predictionAccuracy.percentage}%
            </p>
            <p className="text-xs text-orange-600 mt-1">Accuracy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Builds tab ────────────────────────────────────────────────────────────────

function BuildsTab({ data }: { data: LeaderboardData }) {
  const [showAllBuilds, setShowAllBuilds] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  const builds = showAllBuilds ? data.mostWins : data.mostWins.slice(0, INITIAL_SHOW);
  const models = showAllModels ? data.topModels : data.topModels.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-4">
      {/* Most Wins */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Most Reported Wins
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Grouped by normalized year / make / model / trim</p>
        </div>
        {data.mostWins.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-400">No win data for these filters.</div>
        ) : (
          <>
            {builds.map((entry, i) => (
              <div
                key={entry.buildKey}
                className="flex items-center gap-3 px-5 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
              >
                <span className="font-mono text-sm text-zinc-400 w-6 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-zinc-900 truncate">
                    {entry.displayLabel}
                  </p>
                  {entry.latestRaceType && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Latest: {formatRaceType(entry.latestRaceType)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                    {entry.wins}W
                  </span>
                  {entry.latestShareCode && (
                    <Link
                      href={`/matchup/${entry.latestShareCode}`}
                      className="text-xs text-zinc-400 hover:text-orange-500 transition-colors underline underline-offset-2"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {data.mostWins.length > INITIAL_SHOW && (
              <div className="px-5 py-3 border-t border-zinc-100">
                <button
                  onClick={() => setShowAllBuilds((v) => !v)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
                >
                  {showAllBuilds
                    ? 'Show less'
                    : `Show ${data.mostWins.length - INITIAL_SHOW} more`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top Models */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Top Models
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Grouped by make / model / trim across all years</p>
        </div>
        {data.topModels.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-400">No model data for these filters.</div>
        ) : (
          <>
            {models.map((entry, i) => (
              <div
                key={entry.modelKey}
                className="flex items-center gap-3 px-5 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
              >
                <span className="font-mono text-sm text-zinc-400 w-6 shrink-0">#{i + 1}</span>
                <span className="font-display font-bold text-sm text-zinc-900 flex-1 truncate">
                  {entry.displayLabel}
                </span>
                <span className="font-mono text-sm font-bold text-[var(--color-accent)] shrink-0">
                  {entry.wins}W
                </span>
              </div>
            ))}
            {data.topModels.length > INITIAL_SHOW && (
              <div className="px-5 py-3 border-t border-zinc-100">
                <button
                  onClick={() => setShowAllModels((v) => !v)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
                >
                  {showAllModels
                    ? 'Show less'
                    : `Show ${data.topModels.length - INITIAL_SHOW} more`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Drivers tab ───────────────────────────────────────────────────────────────

function DriversTab({
  data,
  profileMap,
}: {
  data: LeaderboardData;
  profileMap: Map<string, string>;
}) {
  const [showAll, setShowAll] = useState(false);
  const drivers = showAll ? data.topDrivers : data.topDrivers.slice(0, INITIAL_SHOW);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Top Drivers
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">Ranked by submitted closed-course wins</p>
      </div>
      {data.topDrivers.length === 0 ? (
        <div className="px-5 py-6 text-sm text-zinc-400">No driver data for these filters.</div>
      ) : (
        <>
          {drivers.map((entry, i) => {
            const name = profileMap.get(entry.userId) || 'Anonymous';
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-5 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors ${
                  i === 0 ? 'bg-orange-50/50' : ''
                }`}
              >
                <span
                  className={`font-mono text-sm w-6 shrink-0 ${
                    i === 0 ? 'text-[var(--color-accent)] font-bold' : 'text-zinc-400'
                  }`}
                >
                  #{i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-zinc-900 truncate">{name}</span>
                <span className="font-mono text-sm font-bold text-[var(--color-accent)] shrink-0">
                  {entry.wins}W
                </span>
              </div>
            );
          })}
          {data.topDrivers.length > INITIAL_SHOW && (
            <div className="px-5 py-3 border-t border-zinc-100">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
              >
                {showAll
                  ? 'Show less'
                  : `Show ${data.topDrivers.length - INITIAL_SHOW} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────────────────────

function ResultsTab({
  data,
  profileMap,
}: {
  data: LeaderboardData;
  profileMap: Map<string, string>;
}) {
  const [showAllGaps, setShowAllGaps] = useState(false);
  const [showAllPreds, setShowAllPreds] = useState(false);

  const gaps = showAllGaps ? data.biggestGaps : data.biggestGaps.slice(0, INITIAL_SHOW);
  const preds = showAllPreds ? data.recentCorrect : data.recentCorrect.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-4">
      {/* Biggest Gaps */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Biggest Reported Gaps
          </p>
        </div>
        {data.biggestGaps.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-400">No gap data for these filters.</div>
        ) : (
          <>
            {gaps.map((entry, i) => (
              <div
                key={entry.raceResultId}
                className="px-5 py-4 border-b border-zinc-100 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-zinc-400">#{i + 1}</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-orange-200/60">
                      {entry.actualGap}
                    </span>
                  </div>
                  {entry.shareCode && (
                    <Link
                      href={`/matchup/${entry.shareCode}`}
                      className="text-xs text-zinc-400 hover:text-orange-500 transition-colors underline underline-offset-2 shrink-0"
                    >
                      View
                    </Link>
                  )}
                </div>
                <p className="font-display font-bold text-sm text-zinc-900 leading-snug mb-1 truncate">
                  <span className="text-[var(--color-accent)]">{entry.carALabel}</span>
                  <span className="text-zinc-300 mx-1.5">vs</span>
                  <span className="text-zinc-700">{entry.carBLabel}</span>
                </p>
                <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                  <p className="text-xs text-zinc-500">
                    Winner: <span className="text-zinc-700 font-medium">{entry.actualWinner}</span>
                  </p>
                  <p className="text-xs text-zinc-400">{formatProofType(entry.proofType)}</p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lightVerificationBadgeClass(entry.verificationStatus)}`}
                  >
                    {formatVerificationStatus(entry.verificationStatus)}
                  </span>
                  {entry.proofUrl && (
                    <a
                      href={entry.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:text-orange-600 underline underline-offset-2 transition-colors"
                    >
                      View proof
                    </a>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  by {getSubmitterName(entry.userId, profileMap)}
                </p>
                <FlagResultForm raceResultId={entry.raceResultId} />
              </div>
            ))}
            {data.biggestGaps.length > INITIAL_SHOW && (
              <div className="px-5 py-3 border-t border-zinc-100">
                <button
                  onClick={() => setShowAllGaps((v) => !v)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
                >
                  {showAllGaps
                    ? 'Show less'
                    : `Show ${data.biggestGaps.length - INITIAL_SHOW} more`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Correct Predictions */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Recent Correct Predictions
          </p>
        </div>
        {data.recentCorrect.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-400">
            No correct predictions for these filters.
          </div>
        ) : (
          <>
            {preds.map((entry, i) => (
              <div key={i} className="px-5 py-4 border-b border-zinc-100 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-zinc-900 leading-snug truncate">
                      <span className="text-[var(--color-accent)]">{entry.carALabel}</span>
                      <span className="text-zinc-300 mx-1.5">vs</span>
                      <span className="text-zinc-700">{entry.carBLabel}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <p className="text-xs text-zinc-500">
                        Predicted:{' '}
                        <span className="text-green-700 font-medium">{entry.predictedWinner}</span>
                      </p>
                      <p className="text-xs text-zinc-500">
                        Actual:{' '}
                        <span className="text-zinc-700 font-medium">{entry.actualWinner}</span>
                      </p>
                      <p className="text-xs text-zinc-400">{formatRaceType(entry.raceType)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lightVerificationBadgeClass(entry.verificationStatus)}`}
                      >
                        {formatVerificationStatus(entry.verificationStatus)}
                      </span>
                      <p className="text-xs text-zinc-400">
                        by {getSubmitterName(entry.userId, profileMap)}
                      </p>
                    </div>
                  </div>
                  {entry.shareCode && (
                    <Link
                      href={`/matchup/${entry.shareCode}`}
                      className="text-xs text-zinc-400 hover:text-orange-500 transition-colors underline underline-offset-2 shrink-0"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {data.recentCorrect.length > INITIAL_SHOW && (
              <div className="px-5 py-3 border-t border-zinc-100">
                <button
                  onClick={() => setShowAllPreds((v) => !v)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
                >
                  {showAllPreds
                    ? 'Show less'
                    : `Show ${data.recentCorrect.length - INITIAL_SHOW} more`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

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

const selectCls =
  'bg-white border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors cursor-pointer w-full';

interface LeaderboardFilterPanelProps {
  filters: LeaderboardFilters;
  onChange: (key: keyof LeaderboardFilters, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

function LeaderboardFilterPanel({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: LeaderboardFilterPanelProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Filter
        </span>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select
          value={filters.raceType}
          onChange={(e) => onChange('raceType', e.target.value)}
          className={selectCls}
        >
          <option value="all">All Race Types</option>
          <option value="dig">Dig</option>
          <option value="40 roll">40 Roll</option>
          <option value="60 roll">60 Roll</option>
          <option value="60-130">60-130</option>
          <option value="quarter mile">Quarter Mile</option>
        </select>
        <select
          value={filters.proofLevel}
          onChange={(e) => onChange('proofLevel', e.target.value)}
          className={selectCls}
        >
          <option value="all">All Results</option>
          <option value="proof_linked_only">Proof Linked Only</option>
          <option value="proof_claimed_or_linked">Proof Claimed or Linked</option>
          <option value="exclude_disputed">Exclude Disputed</option>
        </select>
        <select
          value={filters.timeWindow}
          onChange={(e) => onChange('timeWindow', e.target.value)}
          className={selectCls}
        >
          <option value="all">All Time</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [rawResults, setRawResults] = useState<ResultWithMatchup[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<LeaderboardFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<Tab>('summary');

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
    <PageShell variant="light" maxWidth="max-w-3xl">

      {/* Page header */}
      <div className="mb-8">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Closed-Course Only
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-zinc-900 leading-none mb-2">
          Community Leaderboard
        </h1>
        <p className="text-zinc-500 text-sm">
          Submitted results and prediction accuracy across all closed-course matchups.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-sm animate-pulse">Loading leaderboard...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* Empty — no data at all */}
      {!loading && !error && hasNoData && (
        <div className="text-center py-20 bg-white border border-zinc-200 rounded-xl">
          <p className="text-zinc-700 text-base font-semibold mb-2">No leaderboard data yet.</p>
          <p className="text-zinc-400 text-sm mb-6 px-6">
            Submit actual results from saved matchups to start ranking builds.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[var(--color-accent)] hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Go to Calculator
          </Link>
        </div>
      )}

      {/* Data available */}
      {!loading && !error && !hasNoData && (
        <>
          <LeaderboardFilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {isEmpty ? (
            <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
              <p className="text-zinc-700 text-base font-semibold mb-2">
                No results match these filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          ) : leaderboard ? (
            <>
              {/* Tab bar */}
              <div className="flex gap-0.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 mb-6 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'summary' && <SummaryTab data={leaderboard} />}
              {activeTab === 'builds'  && <BuildsTab data={leaderboard} />}
              {activeTab === 'drivers' && <DriversTab data={leaderboard} profileMap={profileMap} />}
              {activeTab === 'results' && <ResultsTab data={leaderboard} profileMap={profileMap} />}
            </>
          ) : null}
        </>
      )}

    </PageShell>
  );
}
