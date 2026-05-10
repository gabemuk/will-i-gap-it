import type { ResultWithMatchup } from './types';
import { getCarLabel } from './compare';
import { getBuildKey, getBuildDisplayLabel } from './normalize';

// Gap severity ranking (higher = bigger gap)
const GAP_SEVERITY: Record<string, number> = {
  'Dead even': 0,
  'Half car': 1,
  '1 car': 2,
  '2-3 cars': 3,
  '4-5 cars': 4,
  'Bus length': 5,
};

export function getGapSeverity(gap: string): number {
  return GAP_SEVERITY[gap] ?? -1;
}

// --- Types ---

export interface WinEntry {
  buildKey: string;
  displayLabel: string;
  wins: number;
  latestRaceType: string;
  latestShareCode: string | null;
}

export interface CorrectPredictionEntry {
  carALabel: string;
  carBLabel: string;
  predictedWinner: string;
  actualWinner: string;
  raceType: string;
  shareCode: string | null;
  createdAt: string;
  verificationStatus: string | null;
}

export interface PredictionAccuracy {
  correct: number;
  missed: number;
  total: number;
  percentage: number;
}

export interface BigGapEntry {
  raceResultId: string;
  carALabel: string;
  carBLabel: string;
  actualWinner: string;
  actualGap: string;
  proofType: string;
  proofUrl: string | null;
  verificationStatus: string | null;
  shareCode: string | null;
  severity: number;
  createdAt: string;
}

export interface RaceTypeCounts {
  dig: number;
  '40 roll': number;
  '60 roll': number;
  '60-130': number;
  'quarter mile': number;
}

export interface LeaderboardData {
  mostWins: WinEntry[];
  predictionAccuracy: PredictionAccuracy;
  recentCorrect: CorrectPredictionEntry[];
  biggestGaps: BigGapEntry[];
  totalResults: number;
  raceTypeCounts: RaceTypeCounts;
}

export function buildLeaderboards(results: ResultWithMatchup[]): LeaderboardData {
  const totalResults = results.length;

  // 1. Most Reported Wins (grouped by normalized buildKey, not raw display label)
  const winMap = new Map<string, { displayLabel: string; wins: number; latestRaceType: string; latestShareCode: string | null; latestDate: string }>();

  for (const r of results) {
    if (r.actual_winner === 'Too close / tie') continue;
    const matchup = r.matchups;
    if (!matchup) continue;

    const winningCar = r.actual_winner === 'Car A' ? matchup.car_a : matchup.car_b;
    // Skip entries with no meaningful identity
    const rawLabel = getCarLabel(winningCar);
    if (!rawLabel || rawLabel === 'Car') continue;

    // Group by normalized build key so "2011 BMW M3 comp" and "2011 bmw m3 Competition" merge
    const buildKey = getBuildKey(winningCar);
    const displayLabel = getBuildDisplayLabel(winningCar);

    const existing = winMap.get(buildKey);
    const isNewer = !existing || r.created_at > existing.latestDate;
    winMap.set(buildKey, {
      // Prefer the display label from the most recent entry
      displayLabel: isNewer ? displayLabel : (existing?.displayLabel ?? displayLabel),
      wins: (existing?.wins ?? 0) + 1,
      latestRaceType: isNewer ? (matchup.race_type ?? '') : (existing?.latestRaceType ?? ''),
      latestShareCode: isNewer ? (matchup.share_code ?? null) : (existing?.latestShareCode ?? null),
      latestDate: isNewer ? r.created_at : (existing?.latestDate ?? r.created_at),
    });
  }

  const mostWins: WinEntry[] = Array.from(winMap.entries())
    .map(([buildKey, v]) => ({
      buildKey,
      displayLabel: v.displayLabel,
      wins: v.wins,
      latestRaceType: v.latestRaceType,
      latestShareCode: v.latestShareCode,
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 20);

  // 2. Prediction accuracy
  let correct = 0;
  let missed = 0;
  const recentCorrect: CorrectPredictionEntry[] = [];

  for (const r of results) {
    if (r.prediction_was_correct === null) continue;
    if (r.prediction_was_correct) {
      correct++;
    } else {
      missed++;
    }

    if (r.prediction_was_correct && r.matchups) {
      const matchup = r.matchups;
      const carALabel = getCarLabel(matchup.car_a);
      const carBLabel = getCarLabel(matchup.car_b);
      const predWinner = matchup.prediction.winner;
      const predictedWinner =
        predWinner === 'Car A' ? carALabel :
        predWinner === 'Car B' ? carBLabel :
        'Too Close';

      recentCorrect.push({
        carALabel,
        carBLabel,
        predictedWinner,
        actualWinner: r.actual_winner,
        raceType: matchup.race_type,
        shareCode: matchup.share_code ?? null,
        createdAt: r.created_at,
        verificationStatus: r.verification_status ?? null,
      });
    }
  }

  const total = correct + missed;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const predictionAccuracy: PredictionAccuracy = { correct, missed, total, percentage };

  // Sort recent correct newest first, take 10
  recentCorrect.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentCorrectSlice = recentCorrect.slice(0, 10);

  // 3. Biggest gaps
  const biggestGaps: BigGapEntry[] = results
    .filter((r) => {
      if (!r.matchups) return false;
      const sev = getGapSeverity(r.actual_gap);
      return sev >= 0;
    })
    .map((r) => {
      const matchup = r.matchups!;
      return {
        raceResultId: r.id,
        carALabel: getCarLabel(matchup.car_a),
        carBLabel: getCarLabel(matchup.car_b),
        actualWinner: r.actual_winner,
        actualGap: r.actual_gap,
        proofType: r.proof_type,
        proofUrl: r.proof_url ?? null,
        verificationStatus: r.verification_status ?? null,
        shareCode: matchup.share_code ?? null,
        severity: getGapSeverity(r.actual_gap),
        createdAt: r.created_at,
      };
    })
    .sort((a, b) => b.severity - a.severity || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  // 4. Race type counts
  const raceTypeCounts: RaceTypeCounts = {
    dig: 0,
    '40 roll': 0,
    '60 roll': 0,
    '60-130': 0,
    'quarter mile': 0,
  };

  for (const r of results) {
    const rt = r.matchups?.race_type;
    if (rt && rt in raceTypeCounts) {
      raceTypeCounts[rt as keyof RaceTypeCounts]++;
    }
  }

  return {
    mostWins,
    predictionAccuracy,
    recentCorrect: recentCorrectSlice,
    biggestGaps,
    totalResults,
    raceTypeCounts,
  };
}
