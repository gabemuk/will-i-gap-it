'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import GarageCard from '@/components/GarageCard';
import { supabase } from '@/lib/supabase';
import { formatRaceType, formatVerificationStatus, getVerificationBadgeClass } from '@/lib/format';
import {
  buildInsights,
  insightCarLabels,
  type InsightRow,
  type InsightsData,
  type AccuracyGroup,
} from '@/lib/insights';

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────

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
    ? 'text-orange-400'
    : muted
    ? 'text-zinc-500'
    : 'text-white';
  return (
    <div className="bg-zinc-800/60 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{label}</span>
      <span className={`text-2xl font-black ${textColor}`}>{value}</span>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-black text-orange-500 uppercase tracking-widest">{title}</h2>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
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
      : 'bg-zinc-700';
  return (
    <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1.5">
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
    return <p className="text-zinc-500 text-sm">No data yet.</p>;
  }
  return (
    <div className="space-y-3">
      {entries.map(([key, g]) => (
        <div key={key} className="bg-zinc-800/40 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-semibold text-zinc-200">
              {labelMap[key] ?? key}
            </span>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>{g.total} results</span>
              <span className="text-green-400 font-semibold">{g.correct} correct</span>
              <span
                className={`font-black text-sm ${
                  g.accuracy >= 70
                    ? 'text-green-400'
                    : g.accuracy >= 50
                    ? 'text-amber-400'
                    : g.total > 0
                    ? 'text-red-400'
                    : 'text-zinc-600'
                }`}
              >
                {g.total > 0 ? `${g.accuracy}%` : '—'}
              </span>
            </div>
          </div>
          {g.total > 0 && <AccuracyBar pct={g.accuracy} />}
          {g.avgQualityScore !== null && (
            <p className="text-xs text-zinc-600 mt-1.5">
              Avg quality score: {g.avgQualityScore}
              {g.avgLearningWeight !== null && ` · Avg weight: ${g.avgLearningWeight}`}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function HealthBadge({ count, label, warn = false }: { count: number; label: string; warn?: boolean }) {
  const colors =
    count === 0
      ? 'bg-zinc-800 text-zinc-600'
      : warn
      ? 'bg-red-900/40 text-red-400 border border-red-700/40'
      : 'bg-zinc-800/60 text-zinc-300';
  return (
    <div className={`rounded-lg px-3 py-2.5 flex flex-col gap-0.5 ${colors}`}>
      <span className="text-lg font-black">{count}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function PredictionBadge({ correct }: { correct: boolean | null }) {
  if (correct === null) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-500">
        Unknown
      </span>
    );
  }
  return correct ? (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-900/60 text-green-400 border border-green-700/40">
      ✓ Correct
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-900/40 text-red-400 border border-red-700/40">
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
    <div className="bg-zinc-800/40 rounded-lg px-4 py-3 hover:bg-zinc-800/60 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-1.5">
            {raceType}
          </span>
          <p className="text-sm font-bold text-white leading-snug">
            <span className="text-orange-400">{carA}</span>
            <span className="text-zinc-600 mx-1.5">vs</span>
            <span className="text-orange-400">{carB}</span>
          </p>
        </div>
        <PredictionBadge correct={row.prediction_was_correct} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-zinc-600">Predicted</span>
          <p className="text-zinc-300 font-semibold">{predictedWinner}</p>
        </div>
        <div>
          <span className="text-zinc-600">Actual</span>
          <p className="text-white font-semibold">{row.actual_winner}</p>
        </div>
        <div>
          <span className="text-zinc-600">Gap</span>
          <p className="text-white font-semibold">{row.actual_gap}</p>
        </div>
        <div>
          <span className="text-zinc-600">Proof</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getVerificationBadgeClass(row.verification_status)}`}>
            {formatVerificationStatus(row.verification_status)}
          </span>
        </div>
      </div>
      {(qs !== null || lw !== null) && (
        <p className="text-xs text-zinc-600 mt-2">
          {qs !== null && `Quality: ${qs}`}
          {qs !== null && lw !== null && ' · '}
          {lw !== null && `Weight: ${lw}`}
        </p>
      )}
      {row.matchups?.share_code && (
        <Link
          href={`/matchup/${row.matchups.share_code}`}
          className="text-xs text-orange-500 hover:text-orange-400 underline underline-offset-2 mt-2 inline-block transition-colors"
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
    <div className="bg-zinc-800/40 rounded-lg px-4 py-3 hover:bg-zinc-800/60 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-1">
            {raceType}
          </span>
          <p className="text-sm font-bold text-white leading-snug">
            <span className="text-orange-400">{carA}</span>
            <span className="text-zinc-600 mx-1.5">vs</span>
            <span className="text-orange-400">{carB}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PredictionBadge correct={row.prediction_was_correct} />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getVerificationBadgeClass(row.verification_status)}`}>
            {formatVerificationStatus(row.verification_status)}
          </span>
        </div>
      </div>
      {(qs !== null || lw !== null) && (
        <p className="text-xs text-zinc-500 mt-1.5">
          {qs !== null && `Quality: ${qs}`}
          {qs !== null && lw !== null && ' · '}
          {lw !== null && `Weight: ${lw}`}
        </p>
      )}
      {row.matchups?.share_code && (
        <Link
          href={`/matchup/${row.matchups.share_code}`}
          className="text-xs text-orange-500 hover:text-orange-400 underline underline-offset-2 mt-1.5 inline-block transition-colors"
        >
          View matchup →
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label maps
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [rows, setRows] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // ── Loading / error / empty ────────────────────────────────────────────────

  if (loading) {
    return (
      <PageShell>
        <div className="text-center py-24">
          <p className="text-zinc-500 animate-pulse">Loading insights…</p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="bg-red-950/60 border border-red-700/60 rounded-xl p-6 text-red-300 text-sm text-center">
          {error}
        </div>
      </PageShell>
    );
  }

  if (!insights) {
    return (
      <PageShell>
        <div className="text-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-base font-semibold mb-2">No submitted results yet.</p>
          <p className="text-zinc-600 text-sm">
            Insights will appear as the community adds closed-course results.
          </p>
        </div>
      </PageShell>
    );
  }

  // ── Page ──────────────────────────────────────────────────────────────────

  return (
    <PageShell>

      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
          Prediction Diagnostics
        </h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          These stats help tune future predictions as more closed-course results are submitted.
          All metrics are computed from community-submitted matchup outcomes.
          This is not AI — it&apos;s signal tracking.
        </p>
      </div>

      {/* 1. Summary cards */}
      <GarageCard className="mb-6">
        <SectionHeader title="Overall Summary" />
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
          <StatBadge
            label="No Outcome Data"
            value={insights.notAvailable}
            muted
          />
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
      </GarageCard>

      {/* 2. Accuracy by race type */}
      <GarageCard className="mb-6">
        <SectionHeader
          title="Accuracy by Race Type"
          sub="Only rows with a known outcome (correct / missed) count toward accuracy."
        />
        <AccuracyTable groups={insights.byRaceType} labelMap={RACE_TYPE_LABELS} />
      </GarageCard>

      {/* 3. Accuracy by proof status */}
      <GarageCard className="mb-6">
        <SectionHeader
          title="Accuracy by Proof Status"
          sub="Higher-proof results are generally more reliable learning signals."
        />
        <AccuracyTable groups={insights.byProofStatus} labelMap={PROOF_STATUS_LABELS} />
      </GarageCard>

      {/* 4. Accuracy by proof type */}
      <GarageCard className="mb-6">
        <SectionHeader title="Accuracy by Proof Type" />
        <AccuracyTable groups={insights.byProofType} labelMap={PROOF_TYPE_LABELS} />
      </GarageCard>

      {/* 5. Learning dataset health */}
      <GarageCard className="mb-6">
        <SectionHeader
          title="Learning Dataset Health"
          sub="Only clean, non-disputed results should influence future prediction tuning."
        />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-3">
          <HealthBadge count={insights.datasetHealth.auto_accepted} label="Auto accepted" />
          <HealthBadge count={insights.datasetHealth.needs_review} label="Needs review" warn={insights.datasetHealth.needs_review > 0} />
          <HealthBadge count={insights.datasetHealth.admin_verified} label="Admin verified" />
          <HealthBadge count={insights.datasetHealth.disputed} label="Disputed" warn={insights.datasetHealth.disputed > 0} />
          <HealthBadge count={insights.datasetHealth.rejected} label="Rejected" warn={insights.datasetHealth.rejected > 0} />
          <HealthBadge count={insights.datasetHealth.hiddenFromLearning} label="Hidden (learning)" warn={insights.datasetHealth.hiddenFromLearning > 0} />
          <HealthBadge count={insights.datasetHealth.hiddenFromLeaderboard} label="Hidden (board)" warn={insights.datasetHealth.hiddenFromLeaderboard > 0} />
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Red badges indicate rows that require attention before they can be used as learning signals.
          Disputed and rejected results are excluded automatically.
        </p>
      </GarageCard>

      {/* 6. Recent missed predictions */}
      <GarageCard className="mb-6">
        <SectionHeader
          title="Recent Missed Predictions"
          sub="The most recent closed-course results where the estimated winner was wrong."
        />
        {insights.recentMisses.length === 0 ? (
          <p className="text-zinc-500 text-sm">No missed predictions found.</p>
        ) : (
          <div className="space-y-3">
            {insights.recentMisses.map((row) => (
              <MissRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </GarageCard>

      {/* 7. Best learning candidates */}
      <GarageCard className="mb-6">
        <SectionHeader
          title="Best Learning Candidates"
          sub="High-quality, non-disputed results sorted by quality score. These are the most reliable signals for future tuning."
        />
        {insights.bestLearningCandidates.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No high-quality candidates yet. Results with quality score ≥ 70 or verified proof will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {insights.bestLearningCandidates.map((row) => (
              <CandidateRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </GarageCard>

      {/* Disclaimer */}
      <div className="text-center mt-8">
        <p className="text-zinc-600 text-xs leading-relaxed max-w-xl mx-auto">
          These diagnostics measure where estimated predictions align with submitted closed-course
          results. Results are community-submitted and may be unverified. All predictions are
          estimates for closed-course and track comparison only.
        </p>
      </div>

    </PageShell>
  );
}
