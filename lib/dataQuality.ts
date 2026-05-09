/**
 * dataQuality.ts
 *
 * Pure helper functions for scoring submitted race results.
 * These functions:
 *   - Do not use AI or external APIs.
 *   - Do not use any additional packages.
 *   - Are deterministic given the same input.
 *
 * Usage
 *   import {
 *     calculateResultQualityScore,
 *     calculateLearningWeight,
 *     getReviewStatus,
 *     shouldHideFromLearning,
 *     shouldHideFromLeaderboard,
 *   } from '@/lib/dataQuality';
 */

import type { CarInput, VerificationStatus } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewStatus =
  | 'auto_accepted'
  | 'needs_review'
  | 'admin_verified'
  | 'disputed'
  | 'rejected';

/**
 * All fields used when scoring a submitted race result.
 * carA and carB are optional: they come from the saved matchup and may not
 * always be available at submission time.
 */
export interface DataQualityInput {
  /** Normalized proof type string: 'none' | 'video' | 'dragy' | 'time_slip' | 'dyno_sheet' */
  proofType: string;
  /** Computed verification status from the submission form */
  verificationStatus: VerificationStatus;
  /** Raw proof URL from the user, or null */
  proofUrl: string | null;
  /** Actual gap string chosen by user */
  actualGap: string;
  /** Whether the prediction matched the actual result */
  predictionWasCorrect: boolean;
  /** Car A build from the saved matchup (optional) */
  carA?: CarInput;
  /** Car B build from the saved matchup (optional) */
  carB?: CarInput;
  /** Race type string (optional) */
  raceType?: string;
  /** Free-text notes from the submitter (optional) */
  resultNotes?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal constants
// ─────────────────────────────────────────────────────────────────────────────

/** Gap values considered large enough to be suspicious without proof */
const LARGE_GAPS = new Set(['4-5 cars', 'Bus length']);

/**
 * Patterns that suggest joke or test submissions.
 * Kept intentionally conservative to avoid false positives.
 */
const JOKE_PATTERNS: RegExp[] = [
  /\blol\b/i,
  /\bjk\b/i,
  /\bfake\b/i,
  /\btest\b/i,
  /\bhaha\b/i,
  /\btrolling\b/i,
  /\basdf\b/i,
  /^a+$/i,           // "aaa", "aaaaaaa"
  /^[^a-z0-9]+$/i,  // only punctuation / symbols
];

// ─────────────────────────────────────────────────────────────────────────────
// Internal predicates
// ─────────────────────────────────────────────────────────────────────────────

function hasValidProofUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const t = url.trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

function hasJokeNotes(notes: string | null | undefined): boolean {
  if (!notes) return false;
  const trimmed = notes.trim();
  // Very short non-empty notes are suspicious
  if (trimmed.length > 0 && trimmed.length < 4) return true;
  return JOKE_PATTERNS.some((p) => p.test(trimmed));
}

function carHasCompleteFields(car?: CarInput): boolean {
  if (!car) return false;
  return car.horsepower !== '' && car.weight !== '';
}

function carHasImpossibleValues(car?: CarInput): boolean {
  if (!car) return false;
  if (car.horsepower !== '') {
    const hp = Number(car.horsepower);
    if (hp < 50 || hp > 3000) return true;
  }
  if (car.weight !== '') {
    const wt = Number(car.weight);
    if (wt < 500 || wt > 12000) return true;
  }
  return false;
}

/**
 * A "huge upset" is when the prediction was wrong AND the actual gap was large
 * AND no proof was provided.  These should be flagged for review because they
 * could represent the highest-signal data (a genuinely surprising result with
 * real evidence) or the lowest-signal (a troll submission).
 */
function isHugeUpsetWithNoProof(input: DataQualityInput): boolean {
  if (input.predictionWasCorrect) return false;
  if (!LARGE_GAPS.has(input.actualGap)) return false;
  // Has some form of linked proof → not suspicious
  if (
    input.verificationStatus === 'proof_linked' ||
    input.verificationStatus === 'admin_verified'
  ) return false;
  if (hasValidProofUrl(input.proofUrl)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateResultQualityScore
 *
 * Returns an integer 0 – 100 reflecting how trustworthy a submitted result is.
 *
 * Scoring breakdown (approximate):
 *   Base                               +45
 *   admin_verified                     +30
 *   proof_linked                       +20
 *   proof_claimed                      +10
 *   Dragy / time-slip proof type       +10
 *   Video proof type                   + 8
 *   Dyno sheet proof type              + 5
 *   Valid proof URL (if not linked)    + 5
 *   Both cars have hp + weight         + 5
 *   Car missing hp or weight           − 5
 *   Car has impossible hp/weight       −15
 *   Huge upset with no proof           −15
 *   Joke / spam notes                  −10
 *   disputed                           −40
 *
 * Final value is clamped to [0, 100].
 */
export function calculateResultQualityScore(input: DataQualityInput): number {
  let score = 45;

  // ── Verification status ──────────────────────────────────────────────────
  switch (input.verificationStatus) {
    case 'admin_verified':
      score += 30;
      break;
    case 'proof_linked':
      score += 20;
      break;
    case 'proof_claimed':
      score += 10;
      break;
    case 'disputed':
      score -= 40;
      break;
    case 'unverified':
      // no change
      break;
  }

  // ── Proof type bonuses ───────────────────────────────────────────────────
  if (input.proofType === 'dragy' || input.proofType === 'time_slip') {
    score += 10;
  } else if (input.proofType === 'video') {
    score += 8;
  } else if (input.proofType === 'dyno_sheet') {
    score += 5;
  }

  // ── Valid proof URL (extra credit if not already reflected in status) ─────
  if (
    hasValidProofUrl(input.proofUrl) &&
    input.verificationStatus !== 'proof_linked' &&
    input.verificationStatus !== 'admin_verified'
  ) {
    score += 5;
  }

  // ── Car field completeness ───────────────────────────────────────────────
  const aComplete = carHasCompleteFields(input.carA);
  const bComplete = carHasCompleteFields(input.carB);
  if (aComplete && bComplete) {
    score += 5;
  } else if (input.carA !== undefined || input.carB !== undefined) {
    // At least one car was provided but something is missing
    score -= 5;
  }

  // ── Impossible car values ────────────────────────────────────────────────
  if (carHasImpossibleValues(input.carA) || carHasImpossibleValues(input.carB)) {
    score -= 15;
  }

  // ── Huge upset with no proof ─────────────────────────────────────────────
  if (isHugeUpsetWithNoProof(input)) {
    score -= 15;
  }

  // ── Joke / spam notes ────────────────────────────────────────────────────
  if (hasJokeNotes(input.resultNotes)) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * getReviewStatus
 *
 * Returns the appropriate review status for a submitted result.
 *
 *   disputed        → 'disputed'
 *   admin_verified  → 'admin_verified'
 *   impossible data → 'needs_review'
 *   huge upset, no proof → 'needs_review'
 *   joke / spam notes   → 'needs_review'
 *   otherwise           → 'auto_accepted'
 */
export function getReviewStatus(input: DataQualityInput): ReviewStatus {
  if (input.verificationStatus === 'disputed') return 'disputed';
  if (input.verificationStatus === 'admin_verified') return 'admin_verified';
  if (carHasImpossibleValues(input.carA) || carHasImpossibleValues(input.carB)) {
    return 'needs_review';
  }
  if (isHugeUpsetWithNoProof(input)) return 'needs_review';
  if (hasJokeNotes(input.resultNotes)) return 'needs_review';
  return 'auto_accepted';
}

/**
 * calculateLearningWeight
 *
 * Returns a numeric weight 0 – 10 used to influence how much a submitted
 * result affects future prediction tuning.
 *
 * Base weights by verification status:
 *   admin_verified  → 4.0
 *   proof_linked    → 2.5
 *   proof_claimed   → 1.5
 *   unverified      → 1.0
 *   disputed        → 0  (immediately)
 *   rejected        → 0  (immediately)
 *
 * The base weight is then adjusted by quality score:
 *   quality ≥ 75   → ×1.2 (bonus for high confidence)
 *   quality < 40   → ×0.7 (penalty for low confidence)
 *   quality < 25   → ×0.3 (heavy penalty for very low confidence)
 *
 * Final value is clamped to [0, 10] and rounded to 2 decimal places.
 */
export function calculateLearningWeight(input: DataQualityInput): number {
  // Immediate zero for untrustworthy statuses
  if (input.verificationStatus === 'disputed') return 0;

  const reviewStatus = getReviewStatus(input);
  if (reviewStatus === 'rejected') return 0;

  // Base weight by verification status
  let weight: number;
  switch (input.verificationStatus) {
    case 'admin_verified':
      weight = 4.0;
      break;
    case 'proof_linked':
      weight = 2.5;
      break;
    case 'proof_claimed':
      weight = 1.5;
      break;
    default:
      weight = 1.0;
  }

  // Quality-score adjustment
  const quality = calculateResultQualityScore(input);
  if (quality >= 75) {
    weight *= 1.2;
  } else if (quality < 25) {
    weight *= 0.3;
  } else if (quality < 40) {
    weight *= 0.7;
  }

  return Math.max(0, Math.min(10, parseFloat(weight.toFixed(2))));
}

/**
 * shouldHideFromLearning
 *
 * Returns true when a result should be excluded from future prediction tuning.
 * Rows are hidden if they require human review or have been rejected/disputed.
 */
export function shouldHideFromLearning(reviewStatus: ReviewStatus): boolean {
  return (
    reviewStatus === 'needs_review' ||
    reviewStatus === 'disputed' ||
    reviewStatus === 'rejected'
  );
}

/**
 * shouldHideFromLeaderboard
 *
 * Returns true when a result should not appear on the public leaderboard.
 * Only actively-bad statuses (disputed, rejected) hide from the leaderboard;
 * needs_review rows are still shown while awaiting human review.
 */
export function shouldHideFromLeaderboard(reviewStatus: ReviewStatus): boolean {
  return reviewStatus === 'disputed' || reviewStatus === 'rejected';
}
