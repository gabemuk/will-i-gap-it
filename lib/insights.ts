/**
 * insights.ts
 *
 * Pure helper functions for computing prediction-performance diagnostics from
 * submitted race results.  No AI, no external APIs, no additional packages.
 *
 * These run fully client-side after a Supabase fetch.
 */

import type { CarInput, CompareResult } from './types';
import { getCarLabel } from './compare';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A race_result row joined with its matchup, including all learning fields. */
export interface InsightRow {
  id: string;
  matchup_id: string;
  created_at: string;
  actual_winner: string;
  actual_gap: string;
  proof_type: string;
  proof_url: string | null;
  verification_status: string | null;
  prediction_was_correct: boolean | null;
  // Learning / quality columns — nullable for older rows
  quality_score: number | null;
  learning_weight: number | null;
  review_status: string | null;
  hidden_from_learning: boolean | null;
  hidden_from_leaderboard: boolean | null;
  dispute_count: number | null;
  matchups: {
    share_code: string | null;
    car_a: CarInput;
    car_b: CarInput;
    race_type: string;
    prediction: CompareResult;
  } | null;
}

export interface AccuracyGroup {
  /** Total rows in the group (regardless of whether outcome is known). */
  total: number;
  /** Rows where prediction_was_correct = true. */
  correct: number;
  /** Accuracy percentage (0–100), computed only from rows with known outcome. */
  accuracy: number;
  avgQualityScore: number | null;
  avgLearningWeight: number | null;
}

export interface DatasetHealth {
  auto_accepted: number;
  needs_review: number;
  admin_verified: number;
  disputed: number;
  rejected: number;
  hiddenFromLearning: number;
  hiddenFromLeaderboard: number;
}

export interface InsightsData {
  total: number;
  correct: number;
  missed: number;
  notAvailable: number;
  accuracy: number;
  avgQualityScore: number | null;
  avgLearningWeight: number | null;
  hiddenFromLearning: number;
  byRaceType: Record<string, AccuracyGroup>;
  byProofStatus: Record<string, AccuracyGroup>;
  byProofType: Record<string, AccuracyGroup>;
  datasetHealth: DatasetHealth;
  recentMisses: InsightRow[];
  bestLearningCandidates: InsightRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public helpers
// ─────────────────────────────────────────────────────────────────────────────

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getAverageQualityScore(rows: InsightRow[]): number | null {
  const scored = rows.filter((r) => r.quality_score !== null && r.quality_score !== undefined);
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, r) => acc + (r.quality_score ?? 0), 0);
  return Math.round(sum / scored.length);
}

export function getAverageLearningWeight(rows: InsightRow[]): number | null {
  const weighted = rows.filter(
    (r) => r.learning_weight !== null && r.learning_weight !== undefined,
  );
  if (weighted.length === 0) return null;
  const sum = weighted.reduce((acc, r) => acc + (r.learning_weight ?? 0), 0);
  return parseFloat((sum / weighted.length).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

function buildAccuracyGroup(rows: InsightRow[]): AccuracyGroup {
  const withOutcome = rows.filter((r) => r.prediction_was_correct !== null);
  const correct = withOutcome.filter((r) => r.prediction_was_correct === true).length;
  return {
    total: rows.length,
    correct,
    accuracy: calculateAccuracy(correct, withOutcome.length),
    avgQualityScore: getAverageQualityScore(rows),
    avgLearningWeight: getAverageLearningWeight(rows),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouping functions
// ─────────────────────────────────────────────────────────────────────────────

export function groupAccuracyByRaceType(
  rows: InsightRow[],
): Record<string, AccuracyGroup> {
  const raceTypes = ['dig', '40 roll', '60 roll', '60-130', 'quarter mile'] as const;
  const result: Record<string, AccuracyGroup> = {};
  for (const rt of raceTypes) {
    result[rt] = buildAccuracyGroup(
      rows.filter((r) => r.matchups?.race_type === rt),
    );
  }
  return result;
}

export function groupAccuracyByProofStatus(
  rows: InsightRow[],
): Record<string, AccuracyGroup> {
  const statuses = [
    'unverified',
    'proof_claimed',
    'proof_linked',
    'admin_verified',
    'disputed',
  ] as const;
  const result: Record<string, AccuracyGroup> = {};
  for (const status of statuses) {
    result[status] = buildAccuracyGroup(
      rows.filter((r) => (r.verification_status ?? 'unverified') === status),
    );
  }
  return result;
}

export function groupAccuracyByProofType(
  rows: InsightRow[],
): Record<string, AccuracyGroup> {
  const proofTypes = ['none', 'video', 'dragy', 'time_slip', 'dyno_sheet', 'other'] as const;
  const result: Record<string, AccuracyGroup> = {};
  for (const pt of proofTypes) {
    result[pt] = buildAccuracyGroup(
      rows.filter((r) => (r.proof_type ?? 'none') === pt),
    );
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildInsights(rows: InsightRow[]): InsightsData {
  const withOutcome = rows.filter((r) => r.prediction_was_correct !== null);
  const correct = withOutcome.filter((r) => r.prediction_was_correct === true).length;
  const missed = withOutcome.filter((r) => r.prediction_was_correct === false).length;
  const notAvailable = rows.length - withOutcome.length;

  const hiddenFromLearning = rows.filter((r) => r.hidden_from_learning === true).length;

  const datasetHealth: DatasetHealth = {
    auto_accepted: rows.filter(
      (r) => (r.review_status ?? 'auto_accepted') === 'auto_accepted',
    ).length,
    needs_review: rows.filter((r) => r.review_status === 'needs_review').length,
    admin_verified: rows.filter((r) => r.review_status === 'admin_verified').length,
    disputed: rows.filter((r) => r.review_status === 'disputed').length,
    rejected: rows.filter((r) => r.review_status === 'rejected').length,
    hiddenFromLearning,
    hiddenFromLeaderboard: rows.filter((r) => r.hidden_from_leaderboard === true).length,
  };

  // Recent misses (newest first, up to 10)
  const recentMisses = rows
    .filter((r) => r.prediction_was_correct === false && r.matchups !== null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  // Best learning candidates: not hidden, clean status, quality ≥ 70 OR verified
  const bestLearningCandidates = rows
    .filter((r) => {
      if (r.hidden_from_learning === true) return false;
      const status = r.review_status ?? 'auto_accepted';
      if (status !== 'auto_accepted' && status !== 'admin_verified') return false;
      const qualityOk = (r.quality_score ?? 0) >= 70;
      const verifiedOk =
        r.verification_status === 'proof_linked' ||
        r.verification_status === 'admin_verified';
      return qualityOk || verifiedOk;
    })
    .sort((a, b) => {
      const qs = (b.quality_score ?? 0) - (a.quality_score ?? 0);
      if (qs !== 0) return qs;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 10);

  return {
    total: rows.length,
    correct,
    missed,
    notAvailable,
    accuracy: calculateAccuracy(correct, withOutcome.length),
    avgQualityScore: getAverageQualityScore(rows),
    avgLearningWeight: getAverageLearningWeight(rows),
    hiddenFromLearning,
    byRaceType: groupAccuracyByRaceType(rows),
    byProofStatus: groupAccuracyByProofStatus(rows),
    byProofType: groupAccuracyByProofType(rows),
    datasetHealth,
    recentMisses,
    bestLearningCandidates,
  };
}

/**
 * Produce a human-readable car label from an InsightRow, handling null matchups.
 */
export function insightCarLabels(row: InsightRow): {
  carA: string;
  carB: string;
  predictedWinner: string;
} {
  const matchup = row.matchups;
  if (!matchup) {
    return { carA: 'Car A', carB: 'Car B', predictedWinner: '---' };
  }
  const carA = getCarLabel(matchup.car_a) || 'Car A';
  const carB = getCarLabel(matchup.car_b) || 'Car B';
  const w = matchup.prediction?.winner;
  const predictedWinner =
    w === 'Car A' ? carA : w === 'Car B' ? carB : w === 'Too close' ? 'Too Close' : '---';
  return { carA, carB, predictedWinner };
}
