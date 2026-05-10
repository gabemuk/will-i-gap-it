'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { supabase } from '@/lib/supabase';
import { formatRaceType, formatVerificationStatus } from '@/lib/format';
import {
  buildInsights,
  insightCarLabels,
  type InsightRow,
  type InsightsData,
  type AccuracyGroup,
} from '@/lib/insights';

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

type Tab = 'overview' | 'accuracy' | 'details';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'details',  label: 'Details'  },
];

// ── Small UI helpers ──────────────────────────────────────────────────────────

function StatBadge({
  label,
  value,
  accent = false,
  muted = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  muted?: boolean;
}) {
  const textColor = accent
    ? 'text-[var(--color-accent)]'
    : muted
    ? 'text-zinc-400'
    : 'text-zinc-900';
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
      <span className={`font-mono text-2xl font-bold leading-none ${textColor}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 py-3 border-b border-zinc-100">
      <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        {title}
      </p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function AccuracyBar({ pct }: { pct: number }) {
  const color =
    pct >= 70
      ? 'bg-green-500'
      : pct >= 50
      ? 'bg-amber-500'
      : pct > 0
      ? 'bg-red-500'
      : 'bg-zinc-200';
  return (
    <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function AccuracyTable({
  groups,
  labelMap,
}: {
  groups: Record<string, AccuracyGroup>;
  labelMap: Record<string, string>;
}) {
  const entries = Object.entries(groups).filter(([, g]) => g.total > 0);
  if (entries.length === 0) {
    return (
      <div className="px-5 py-6 text-sm text-zinc-400">No data yet.</div>
    );
  }
  return (
    <>
      {entries.map(([key, g]) => (
        <div key={key} className="px-5 py-3 border-b border-zinc-100 last:border-b-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-semibold text-zinc-700">
              {labelMap[key] ?? key}
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">
                <span className="font-mono">{g.total}</span> results
              </span>
              <span className="text-green-700 font-semibold">
                <span className="font-mono">{g.correct}</span> correct
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  g.accuracy >= 70
                    ? 'text-green-700'
                    : g.accuracy >= 50
                    ? 'text-amber-600'
                    : g.total > 0
                    ? 'text-red-600'
                    : 'text-zinc-400'
                }`}
              >
                {g.total > 0 ? `${g.accuracy}%` : '—'}
              </span>
            </div>
          </div>
          {g.total > 0 && <AccuracyBar pct={g.accuracy} />}
          {g.avgQualityScore !== null && (
            <p className="text-xs text-zinc-400 mt-1.5">
              Avg quality score: <span className="font-mono">{g.avgQualityScore}</span>
              {g.avgLearningWeight !== null && (
                <> · Avg weight: <span className="font-mono">{g.avgLearningWeight}</span></>
              )}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

function HealthBadge({
  count,
  label,
  warn = false,
}: {
  count: number;
  label: string;
  warn?: boolean;
}) {
  const colors =
    count === 0
      ? 'bg-zinc-50 border border-zinc-200 text-zinc-400'
      : warn
      ? 'bg-red-50 border border-red-200 text-red-700'
      : 'bg-zinc-50 border border-zinc-200 text-zinc-700';
  return (
    <div className={`rounded-lg px-3 py-2.5 flex flex-col gap-0.5 ${colors}`}>
      <span className="font-mono text-lg font-bold leading-none">{count}</span>
      <span className="text-xs text-zinc-500 leading-snug">{label}</span>
    </div>
  );
}

function PredictionBadge({ correct }: { correct: boolean | null }) {
  if (correct === null) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-500">
        Unknown
      </span>
    );
  }
  return correct ? (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
      ✓ Correct
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      ✗ Missed
    </span>
  );
}

function MissRow({ row }: { row: InsightRow }) {
  const { carA, carB, predictedWinner } = insightCarLabels(row);
  const raceType = row.matchups?.race_type ? formatRaceType(row.matchups.race_type) : '—';
  const qs = row.quality_score ?? null;
  const lw = row.learning_weight ?? null;

  return (
    <div className="px-5 py-4 border-b border-zinc-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="min-w-0">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-orange-200/60 mb-1.5">
            {raceType}
          </span>
          <p className="font-display font-bold text-sm text-zinc-900 leading-snug truncate">
            <span className="text-[var(--color-accent)]">{carA}</span>
            <span className="text-zinc-300 mx-1.5">vs</span>
            <span className="text-zinc-700">{carB}</span>
          </p>
        </div>
        <PredictionBadge correct={row.prediction_was_correct} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
        <div>
          <p className="text-zinc-400 mb-0.5">Predicted</p>
          <p className="text-zinc-600 font-semibold">{predictedWinner}</p>
        </div>
        <div>
          <p className="text-zinc-400 mb-0.5">Actual</p>
          <p className="text-zinc-900 font-semibold">{row.actual_winner}</p>
        </div>
        <div>
          <p className="text-zinc-400 mb-0.5">Gap</p>
          <p className="font-mono text-zinc-900 font-semibold">{row.actual_gap}</p>
        </div>
        <div>
          <p className="text-zinc-400 mb-0.5">Proof</p>
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${lightVerificationBadgeClass(row.verification_status)}`}
          >
            {formatVerificationStatus(row.verification_status)}
          </span>
        </div>
      </div>
      {(qs !== null || lw !== null) && (
        <p className="text-xs text-zinc-400">
          {qs !== null && <>Quality: <span className="font-mono">{qs}</span></>}
          {qs !== null && lw !== null && ' · '}
          {lw !== null && <>Weight: <span className="font-mono">{lw}</span></>}
        </p>
      )}
      {row.matchups?.share_code && (
        <Link
          href={`/matchup/${row.matchups.share_code}`}
          className="text-xs text-orange-500 hover:text-orange-600 underline underline-offset-2 mt-1.5 inline-block transition-colors"
        >
          View matchup →
        </Link>
      )}
    </div>
  );
}

function CandidateRow({ row }: { row: InsightRow }) {
  const { carA, carB } = insightCarLabels(row);
  const raceType = row.matchups?.race_type ? formatRaceType(row.matchups.race_type) : '—';
  const qs = row.quality_score ?? null;
  const lw = row.learning_weight ?? null;

  return (
    <div className="px-5 py-4 border-b border-zinc-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <div className="min-w-0">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-orange-200/60 mb-1">
            {raceType}
          </span>
          <p className="font-display font-bold text-sm text-zinc-900 leading-snug truncate">
            <span className="text-[var(--color-accent)]">{carA}</span>
            <span className="text-zinc-300 mx-1.5">vs</span>
            <span className="text-zinc-700">{carB}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <PredictionBadge correct={row.prediction_was_correct} />
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${lightVerificationBadgeClass(row.verification_status)}`}
          >
            {formatVerificationStatus(row.verification_status)}
          </span>
        </div>
      </div>
      {(qs !== null || lw !== null) && (
        <p className="text-xs text-zinc-400 mt-1.5">
          {qs !== null && <>Quality: <span className="font-mono">{qs}</span></>}
          {qs !== null && lw !== null && ' · '}
          {lw !== null && <>Weight: <span className="font-mono">{lw}</span></>}
        </p>
      )}
      {row.matchups?.share_code && (
        <Link
          href={`/matchup/${row.matchups.share_code}`}
          className="text-xs text-orange-500 hover:text-orange-600 underline underline-offset-2 mt-1.5 inline-block transition-colors"
        >
          View matchup →
        </Link>
      )}
    </div>
  );
}

// ── Label maps ────────────────────────────────────────────────────────────────

const RACE_TYPE_LABELS: Record<string, string> = {
  dig: 'Dig',
  '40 roll': '40 Roll',
  '60 roll': '60 Roll',
  '60-130': '60-130',
  'quarter mile': 'Quarter Mile',
};

const PROOF_STATUS_LABELS: Record<string, string> = {
  unverified: 'Unverified',
  proof_claimed: 'Proof Claimed',
  proof_linked: 'Proof Linked',
  admin_verified: 'Admin Verified',
  disputed: 'Disputed',
};

const PROOF_TYPE_LABELS: Record<string, string> = {
  none: 'None',
  video: 'Video',
  dragy: 'Dragy',
  time_slip: 'Timeslip',
  dyno_sheet: 'Dyno Sheet',
  other: 'Other',
};

// ── Tab panels ────────────────────────────────────────────────────────────────

function OverviewTab({ insights }: { insights: InsightsData }) {
  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Overall Summary
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StatBadge label="Total Results" value={insights.total} />
          <StatBadge label="Correct" value={insights.correct} accent />
          <StatBadge label="Missed" value={insights.missed} />
          <StatBadge
            label="Accuracy"
            value={insights.total > 0 ? `${insights.accuracy}%` : '—'}
            accent
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBadge
            label="Avg Quality Score"
            value={insights.avgQualityScore !== null ? insights.avgQualityScore : '—'}
            muted={insights.avgQualityScore === null}
          />
          <StatBadge
            label="Avg Learning Weight"
            value={insights.avgLearningWeight !== null ? insights.avgLearningWeight : '—'}
            muted={insights.avgLearningWeight === null}
          />
          <StatBadge label="No Outcome Data" value={insights.notAvailable} muted />
          <StatBadge
            label="Excluded from Learning"
            value={insights.hiddenFromLearning}
            muted={insights.hiddenFromLearning === 0}
          />
        </div>
        {insights.total > 0 && (
          <div className="mt-4">
            <AccuracyBar pct={insights.accuracy} />
          </div>
        )}
      </div>

      {/* Dataset health */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <SectionTitle
          title="Learning Dataset Health"
          sub="Only clean, non-disputed results influence future prediction tuning."
        />
        <div className="p-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-3">
            <HealthBadge count={insights.datasetHealth.auto_accepted} label="Auto accepted" />
            <HealthBadge
              count={insights.datasetHealth.needs_review}
              label="Needs review"
              warn={insights.datasetHealth.needs_review > 0}
            />
            <HealthBadge count={insights.datasetHealth.admin_verified} label="Admin verified" />
            <HealthBadge
              count={insights.datasetHealth.disputed}
              label="Disputed"
              warn={insights.datasetHealth.disputed > 0}
            />
            <HealthBadge
              count={insights.datasetHealth.rejected}
              label="Rejected"
              warn={insights.datasetHealth.rejected > 0}
            />
            <HealthBadge
              count={insights.datasetHealth.hiddenFromLearning}
              label="Hidden (learning)"
              warn={insights.datasetHealth.hiddenFromLearning > 0}
            />
            <HealthBadge
              count={insights.datasetHealth.hiddenFromLeaderboard}
              label="Hidden (board)"
              warn={insights.datasetHealth.hiddenFromLeaderboard > 0}
            />
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Red badges indicate rows that require attention before they can be used as learning signals.
            Disputed and rejected results are excluded automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

function AccuracyTab({ insights }: { insights: InsightsData }) {
  return (
    <div className="space-y-4">
      {/* By race type */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <SectionTitle
          title="Accuracy by Race Type"
          sub="Only rows with a known outcome (correct / missed) count toward accuracy."
        />
        <AccuracyTable groups={insights.byRaceType} labelMap={RACE_TYPE_LABELS} />
      </div>

      {/* By proof status */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <SectionTitle
          title="Accuracy by Proof Status"
          sub="Higher-proof results are generally more reliable learning signals."
        />
        <AccuracyTable groups={insights.byProofStatus} labelMap={PROOF_STATUS_LABELS} />
      </div>

      {/* By proof type */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <SectionTitle title="Accuracy by Proof Type" />
        <AccuracyTable groups={insights.byProofType} labelMap={PROOF_TYPE_LABELS} />
      </div>
    </div>
  );
}

const INITIAL_SHOW = 5;

function DetailsTab({ insights }: { insights: InsightsData }) {
  const [showAllMisses, setShowAllMisses] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  const visibleMisses = showAllMisses
    ? insights.recentMisses
    : insights.recentMisses.slice(0, INITIAL_SHOW);
  const visibleCandidates = showAllCandidates
    ? insights.bestLearningCandidates
    : insights.bestLearningCandidates.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-4">
      {/* Recent missed predictions */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <SectionTitle
          title="Recent Missed Predictions"
          sub="The most recent closed-course results where the estimated winner was wrong."
        />
        {insights.recentMisses.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-400">No missed predictions found.</div>
        ) : (
          <>
            {visibleMisses.map((row) => (
              <MissRow key={row.id} row={row} />
            ))}
            {insights.recentMisses.length > INITIAL_SHOW && (
              <div className="px-5 py-3 border-t border-zinc-100">
                <button
                  onClick={() => setShowAllMisses((v) => !v)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
                >
                  {showAllMisses
                    ? 'Show less'
                    : `Show ${insights.recentMisses.length - INITIAL_SHOW} more`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Best learning candidates */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <SectionTitle
          title="Best Learning Candidates"
          sub="High-quality, non-disputed results sorted by quality score."
        />
        {insights.bestLearningCandidates.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-400">
            No high-quality candidates yet. Results with quality score ≥ 70 or verified proof will
            appear here.
          </div>
        ) : (
          <>
            {visibleCandidates.map((row) => (
              <CandidateRow key={row.id} row={row} />
            ))}
            {insights.bestLearningCandidates.length > INITIAL_SHOW && (
              <div className="px-5 py-3 border-t border-zinc-100">
                <button
                  onClick={() => setShowAllCandidates((v) => !v)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors underline underline-offset-2"
                >
                  {showAllCandidates
                    ? 'Show less'
                    : `Show ${insights.bestLearningCandidates.length - INITIAL_SHOW} more`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [rows, setRows] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    async function fetchData() {
      const { data, error: dbError } = await supabase
        .from('race_results')
        .select(`
          id,
          matchup_id,
          created_at,
          actual_winner,
          actual_gap,
          proof_type,
          proof_url,
          verification_status,
          prediction_was_correct,
          quality_score,
          learning_weight,
          review_status,
          hidden_from_learning,
          hidden_from_leaderboard,
          dispute_count,
          matchups (
            share_code,
            car_a,
            car_b,
            race_type,
            prediction
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (dbError) {
        setError('Could not load insights.');
      } else {
        setRows((data ?? []) as unknown as InsightRow[]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const insights: InsightsData | null = useMemo(
    () => (rows.length > 0 ? buildInsights(rows) : null),
    [rows],
  );

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageShell variant="light">
        <div className="text-center py-24">
          <p className="text-zinc-400 text-sm animate-pulse">Loading insights…</p>
        </div>
      </PageShell>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <PageShell variant="light">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm text-center">
          {error}
        </div>
      </PageShell>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────

  if (!insights) {
    return (
      <PageShell variant="light">
        <div className="text-center py-24 bg-white border border-zinc-200 rounded-xl">
          <p className="text-zinc-700 text-base font-semibold mb-2">No submitted results yet.</p>
          <p className="text-zinc-400 text-sm">
            Insights will appear as the community adds closed-course results.
          </p>
        </div>
      </PageShell>
    );
  }

  // ── Page ───────────────────────────────────────────────────────────────────

  return (
    <PageShell variant="light">

      {/* Page header */}
      <div className="mb-8">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Closed-Course Only
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-zinc-900 leading-none mb-2">
          Prediction Insights
        </h1>
        <p className="text-zinc-500 text-sm max-w-2xl">
          Community-submitted closed-course data and prediction performance. These metrics are
          computed from matchup outcomes — not AI, signal tracking.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
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
      {activeTab === 'overview' && <OverviewTab insights={insights} />}
      {activeTab === 'accuracy' && <AccuracyTab insights={insights} />}
      {activeTab === 'details'  && <DetailsTab  insights={insights} />}

      {/* Disclaimer */}
      <div className="text-center mt-8">
        <p className="text-zinc-400 text-xs leading-relaxed max-w-xl mx-auto">
          These diagnostics measure where estimated predictions align with submitted closed-course
          results. Results are community-submitted and may be unverified. All predictions are
          estimates for closed-course and track comparison only.
        </p>
      </div>

    </PageShell>
  );
}
