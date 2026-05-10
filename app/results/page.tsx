'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { supabase } from '@/lib/supabase';
import { getCarLabel } from '@/lib/compare';
import {
  formatRaceType,
  formatProofType,
  formatDate,
  formatVerificationStatus,
} from '@/lib/format';
import {
  resultMatchesRaceType,
  resultMatchesPrediction,
  resultMatchesProofStatus,
  resultMatchesProofType,
  resultMatchesSearch,
  getGapSortValue,
  type RaceTypeFilter,
  type PredictionFilter,
  type ProofStatusFilter,
  type ProofTypeFilter,
  type SortOrder,
} from '@/lib/resultFilters';
import type { ResultWithMatchup } from '@/lib/types';
import FlagResultForm from '@/components/FlagResultForm';
import { buildProfileMap, collectUserIds, getSubmitterName } from '@/lib/profileDisplay';

// ── Local badge helper (light-theme equivalent of getVerificationBadgeClass) ──

function lightVerificationBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'proof_claimed':  return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'proof_linked':   return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'admin_verified': return 'bg-green-50 text-green-700 border border-green-200';
    case 'disputed':       return 'bg-red-50 text-red-700 border border-red-200';
    default:               return 'bg-zinc-100 text-zinc-500 border border-zinc-200';
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PredictionBadge({ correct }: { correct: boolean | null }) {
  if (correct === null) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-500">
        No Prediction
      </span>
    );
  }
  return correct ? (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
      Correct
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      Missed
    </span>
  );
}

function ResultEntry({ result, submitterName }: { result: ResultWithMatchup; submitterName: string }) {
  const matchup = result.matchups;
  const carALabel = matchup ? (getCarLabel(matchup.car_a) || 'Car A') : 'Car A';
  const carBLabel = matchup ? (getCarLabel(matchup.car_b) || 'Car B') : 'Car B';

  const predictedWinner =
    matchup?.prediction.winner === 'Car A' ? carALabel :
    matchup?.prediction.winner === 'Car B' ? carBLabel :
    matchup?.prediction.winner === 'Too close' ? 'Too Close to Call' : '---';

  const raceType = matchup?.race_type ? formatRaceType(matchup.race_type) : '---';

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 transition-colors">

      {/* Header: race badge + car matchup + prediction outcome */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-zinc-100">
        <div className="min-w-0">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-orange-200/60 mb-2">
            {raceType}
          </span>
          <p className="font-display font-bold text-base text-zinc-900 leading-snug">
            <span className="text-[var(--color-accent)]">{carALabel}</span>
            <span className="text-zinc-300 mx-2">vs</span>
            <span className="text-zinc-700">{carBLabel}</span>
          </p>
        </div>
        <div className="flex-shrink-0 pt-0.5">
          <PredictionBadge correct={result.prediction_was_correct} />
        </div>
      </div>

      {/* Stats grid — 2-col on mobile, 4-col on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-zinc-100">
        <div className="px-4 py-3 border-r border-b sm:border-b-0 border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Predicted</p>
          <p className="text-sm text-zinc-500 leading-snug">{predictedWinner}</p>
        </div>
        <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Winner</p>
          <p className="text-sm font-bold text-zinc-900 leading-snug">{result.actual_winner}</p>
        </div>
        <div className="px-4 py-3 border-r border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Gap</p>
          <p className="font-mono text-sm font-semibold text-zinc-900">{result.actual_gap}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Proof</p>
          <p className="text-sm text-zinc-600">{formatProofType(result.proof_type)}</p>
        </div>
      </div>

      {/* Footer: verification + proof link + date + submitter */}
      <div className="px-5 py-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lightVerificationBadgeClass(result.verification_status)}`}>
              {formatVerificationStatus(result.verification_status)}
            </span>
            {result.proof_url && (
              <a
                href={result.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-500 hover:text-orange-600 underline underline-offset-2 transition-colors"
              >
                View proof
              </a>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-zinc-400">{formatDate(result.created_at)}</p>
            <p className="text-xs text-zinc-400">
              by <span className="text-zinc-500">{submitterName}</span>
            </p>
          </div>
        </div>

        {result.result_notes && (
          <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-200 pl-3 mt-2">
            {result.result_notes}
          </p>
        )}

        <div className="flex items-center mt-2 pt-2 border-t border-zinc-100">
          {matchup?.share_code && (
            <Link
              href={`/matchup/${matchup.share_code}`}
              className="text-xs text-zinc-400 hover:text-orange-500 transition-colors underline underline-offset-2"
            >
              View original matchup
            </Link>
          )}
        </div>
        <FlagResultForm raceResultId={result.id} />
      </div>

    </div>
  );
}

// ── Filter types ──────────────────────────────────────────────────────────────

interface Filters {
  raceType: RaceTypeFilter;
  prediction: PredictionFilter;
  proofStatus: ProofStatusFilter;
  proofType: ProofTypeFilter;
  search: string;
  sort: SortOrder;
}

const DEFAULT_FILTERS: Filters = {
  raceType: 'all',
  prediction: 'all',
  proofStatus: 'all',
  proofType: 'all',
  search: '',
  sort: 'newest',
};

const selectCls =
  'bg-white border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors cursor-pointer w-full';

interface FilterPanelProps {
  filters: Filters;
  onChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

function FilterPanel({ filters, onChange, onClear, hasActiveFilters }: FilterPanelProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Filter &amp; Sort
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

      <div className="mb-3">
        <input
          type="text"
          placeholder="Search car or build..."
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors placeholder:text-zinc-400"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
          value={filters.prediction}
          onChange={(e) => onChange('prediction', e.target.value)}
          className={selectCls}
        >
          <option value="all">All Predictions</option>
          <option value="correct">Correct</option>
          <option value="missed">Missed</option>
        </select>

        <select
          value={filters.proofStatus}
          onChange={(e) => onChange('proofStatus', e.target.value)}
          className={selectCls}
        >
          <option value="all">All Proof Status</option>
          <option value="unverified">Unverified</option>
          <option value="proof_claimed">Proof Claimed</option>
          <option value="proof_linked">Proof Linked</option>
          <option value="admin_verified">Admin Verified</option>
          <option value="disputed">Disputed</option>
        </select>

        <select
          value={filters.proofType}
          onChange={(e) => onChange('proofType', e.target.value)}
          className={selectCls}
        >
          <option value="all">All Proof Types</option>
          <option value="none">None</option>
          <option value="video">Video</option>
          <option value="dragy">Dragy</option>
          <option value="time_slip">Timeslip</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange('sort', e.target.value)}
          className={selectCls}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="biggest_gap">Biggest Gap First</option>
        </select>
      </div>
    </div>
  );
}

// ── Progressive disclosure constants ──────────────────────────────────────────

const INITIAL_DISPLAY = 5;
const LOAD_MORE_COUNT = 10;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [results, setResults] = useState<ResultWithMatchup[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);

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
        .limit(50);

      if (dbError) {
        setError('Could not load results. Please try again later.');
      } else {
        const rows = (data ?? []) as unknown as ResultWithMatchup[];
        setResults(rows);

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
    fetchResults();
  }, []);

  function handleFilterChange(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value as Filters[keyof Filters] }));
    setDisplayCount(INITIAL_DISPLAY);
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
    setDisplayCount(INITIAL_DISPLAY);
  }

  const hasActiveFilters =
    filters.raceType !== 'all' ||
    filters.prediction !== 'all' ||
    filters.proofStatus !== 'all' ||
    filters.proofType !== 'all' ||
    filters.search.trim() !== '' ||
    filters.sort !== 'newest';

  const filteredResults = useMemo(() => {
    let out = results.filter(
      (r) =>
        resultMatchesRaceType(r, filters.raceType) &&
        resultMatchesPrediction(r, filters.prediction) &&
        resultMatchesProofStatus(r, filters.proofStatus) &&
        resultMatchesProofType(r, filters.proofType) &&
        resultMatchesSearch(r, filters.search),
    );

    if (filters.sort === 'oldest') {
      out = [...out].sort((a, b) => a.created_at.localeCompare(b.created_at));
    } else if (filters.sort === 'biggest_gap') {
      out = [...out].sort((a, b) => getGapSortValue(b.actual_gap) - getGapSortValue(a.actual_gap));
    }
    return out;
  }, [results, filters]);

  const visibleResults = filteredResults.slice(0, displayCount);
  const hasMore = displayCount < filteredResults.length;
  const hasExpanded = displayCount > INITIAL_DISPLAY;

  return (
    <PageShell variant="light" maxWidth="max-w-3xl">

      {/* Page header */}
      <div className="mb-8">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Closed-Course Only
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-zinc-900 leading-none mb-2">
          Community Results
        </h1>
        <p className="text-zinc-500 text-sm">
          User-submitted closed-course matchup outcomes. Results are unverified unless marked otherwise.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-sm animate-pulse">Loading results...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && results.length === 0 && (
        <div className="text-center py-20 bg-white border border-zinc-200 rounded-xl">
          <p className="text-zinc-700 text-base font-semibold mb-2">No results yet.</p>
          <p className="text-zinc-400 text-sm mb-6">
            Be the first to submit a closed-course matchup outcome.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[var(--color-accent)] hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Go to Calculator
          </Link>
        </div>
      )}

      {/* Results + filters */}
      {!loading && !error && results.length > 0 && (
        <>
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {filteredResults.length === 0 ? (
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
          ) : (
            <>
              <div className="space-y-3">
                {visibleResults.map((result) => (
                  <ResultEntry
                    key={result.id}
                    result={result}
                    submitterName={getSubmitterName(result.user_id, profileMap)}
                  />
                ))}
              </div>

              {(hasMore || hasExpanded) && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {hasMore && (
                    <button
                      onClick={() => setDisplayCount((c) => c + LOAD_MORE_COUNT)}
                      className="px-6 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold text-sm rounded-xl transition-colors"
                    >
                      Load more ({filteredResults.length - displayCount} remaining)
                    </button>
                  )}
                  {hasExpanded && (
                    <button
                      onClick={() => setDisplayCount(INITIAL_DISPLAY)}
                      className="px-6 py-2.5 text-zinc-500 hover:text-zinc-700 font-semibold text-sm transition-colors underline underline-offset-2"
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

    </PageShell>
  );
}
