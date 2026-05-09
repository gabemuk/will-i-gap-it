import type { ResultWithMatchup } from './types';
import { getCarLabel } from './compare';

// --- Filter types ---

export type RaceTypeFilter = 'all' | 'dig' | '40 roll' | '60 roll' | '60-130' | 'quarter mile';
export type PredictionFilter = 'all' | 'correct' | 'missed';
export type ProofStatusFilter =
  | 'all'
  | 'unverified'
  | 'proof_claimed'
  | 'proof_linked'
  | 'admin_verified'
  | 'disputed';
export type ProofTypeFilter = 'all' | 'none' | 'video' | 'dragy' | 'time_slip' | 'other';
export type SortOrder = 'newest' | 'oldest' | 'biggest_gap';
export type TimeWindowFilter = 'all' | '7days' | '30days';
export type ProofLevelFilter =
  | 'all'
  | 'proof_linked_only'
  | 'proof_claimed_or_linked'
  | 'exclude_disputed';

// Gap severity for sorting (higher = bigger gap)
const GAP_SEVERITY: Record<string, number> = {
  'Dead even': 0,
  'Half car': 1,
  '1 car': 2,
  '2-3 cars': 3,
  '4-5 cars': 4,
  'Bus length': 5,
};

// --- Filter helpers ---

export function resultMatchesRaceType(
  result: ResultWithMatchup,
  filter: RaceTypeFilter,
): boolean {
  if (filter === 'all') return true;
  return result.matchups?.race_type === filter;
}

export function resultMatchesPrediction(
  result: ResultWithMatchup,
  filter: PredictionFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'correct') return result.prediction_was_correct === true;
  if (filter === 'missed') return result.prediction_was_correct === false;
  return true;
}

export function resultMatchesProofStatus(
  result: ResultWithMatchup,
  filter: ProofStatusFilter,
): boolean {
  if (filter === 'all') return true;
  return result.verification_status === filter;
}

export function resultMatchesProofType(
  result: ResultWithMatchup,
  filter: ProofTypeFilter,
): boolean {
  if (filter === 'all') return true;
  return (result.proof_type ?? '').toLowerCase() === filter;
}

export function resultMatchesSearch(result: ResultWithMatchup, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const matchup = result.matchups;
  if (!matchup) return false;
  const carA = getCarLabel(matchup.car_a).toLowerCase();
  const carB = getCarLabel(matchup.car_b).toLowerCase();
  return carA.includes(q) || carB.includes(q);
}

export function resultInTimeWindow(
  result: ResultWithMatchup,
  window: TimeWindowFilter,
): boolean {
  if (window === 'all') return true;
  const days = window === '7days' ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(result.created_at) >= cutoff;
}

export function resultMatchesProofLevel(
  result: ResultWithMatchup,
  filter: ProofLevelFilter,
): boolean {
  if (filter === 'all') return true;
  const vs = result.verification_status;
  if (filter === 'proof_linked_only') return vs === 'proof_linked' || vs === 'admin_verified';
  if (filter === 'proof_claimed_or_linked')
    return vs === 'proof_claimed' || vs === 'proof_linked' || vs === 'admin_verified';
  if (filter === 'exclude_disputed') return vs !== 'disputed';
  return true;
}

export function getGapSortValue(gap: string): number {
  return GAP_SEVERITY[gap] ?? -1;
}
