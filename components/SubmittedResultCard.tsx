'use client';

import { formatProofType, formatDate } from '@/lib/format';
import type { RaceResult } from '@/lib/types';

interface Props {
  result: RaceResult;
  carAName: string;
  carBName: string;
}

export default function SubmittedResultCard({ result, carAName, carBName }: Props) {
  const predictionCorrect = result.prediction_was_correct;

  // Map stored winner keys back to display labels
  function winnerDisplay(winner: string) {
    if (winner === 'Car A') return `${carAName} (Car A)`;
    if (winner === 'Car B') return `${carBName} (Car B)`;
    return winner; // "Too close / tie"
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-0.5">
            Submitted Result
          </h3>
          <p className="text-zinc-600 text-xs">
            Reported {formatDate(result.created_at)}
          </p>
        </div>

        {/* Prediction badge */}
        {predictionCorrect !== null && (
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              predictionCorrect
                ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                : 'bg-red-900/40 text-red-400 border border-red-700/40'
            }`}
          >
            {predictionCorrect ? 'Prediction correct' : 'Prediction missed'}
          </span>
        )}
      </div>

      {/* Result stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-1">Actual Winner</p>
          <p className="text-sm font-semibold text-white leading-snug">
            {winnerDisplay(result.actual_winner)}
          </p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-1">Actual Gap</p>
          <p className="text-sm font-semibold text-white leading-snug">
            {result.actual_gap}
          </p>
        </div>
      </div>

      {/* Proof type */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-4 py-3 mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Proof</p>
        <p className="text-sm text-zinc-300">
          {formatProofType(result.proof_type)}
        </p>
      </div>

      {/* Notes */}
      {result.result_notes && (
        <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-4 py-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-zinc-400 leading-relaxed italic">
            {result.result_notes}
          </p>
        </div>
      )}
    </div>
  );
}
