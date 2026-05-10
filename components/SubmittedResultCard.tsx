'use client';

import { formatProofType, formatDate, formatVerificationStatus } from '@/lib/format';
import type { RaceResult } from '@/lib/types';

// Light verification badge — avoids dark classes from lib/format.ts
function lightVerificationBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'proof_claimed':  return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'proof_linked':   return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'admin_verified': return 'bg-green-50 text-green-700 border border-green-200';
    case 'disputed':       return 'bg-red-50 text-red-700 border border-red-200';
    default:               return 'bg-zinc-100 text-zinc-500 border border-zinc-200';
  }
}

interface Props {
  result: RaceResult;
  carAName: string;
  carBName: string;
  submitterName?: string;
}

export default function SubmittedResultCard({ result, carAName, carBName, submitterName }: Props) {
  const predictionCorrect = result.prediction_was_correct;

  function winnerDisplay(winner: string) {
    if (winner === 'Car A') return `${carAName} (Car A)`;
    if (winner === 'Car B') return `${carBName} (Car B)`;
    return winner;
  }

  const verificationStatus = result.verification_status ?? 'unverified';

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">

      {/* Section header */}
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
            Submitted Result
          </p>
          <p className="text-zinc-400 text-xs">
            Reported {formatDate(result.created_at)}
          </p>
          {submitterName && (
            <p className="text-zinc-400 text-xs">
              by <span className="text-zinc-600">{submitterName}</span>
            </p>
          )}
        </div>

        {/* Prediction badge */}
        {predictionCorrect !== null && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              predictionCorrect
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {predictionCorrect ? 'Prediction correct' : 'Prediction missed'}
          </span>
        )}
      </div>

      {/* Result stats */}
      <div className="grid grid-cols-2 border-b border-zinc-100">
        <div className="px-5 py-4 border-r border-zinc-100">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
            Actual Winner
          </p>
          <p className="text-sm font-semibold text-zinc-800 leading-snug">
            {winnerDisplay(result.actual_winner)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
            Actual Gap
          </p>
          <p className="font-mono text-sm font-semibold text-zinc-800 leading-snug">
            {result.actual_gap}
          </p>
        </div>
      </div>

      {/* Proof + verification */}
      <div className={`px-5 py-3 ${result.result_notes ? 'border-b border-zinc-100' : ''}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Proof
            </p>
            <p className="text-sm text-zinc-600">
              {formatProofType(result.proof_type)}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${lightVerificationBadgeClass(verificationStatus)}`}>
            {formatVerificationStatus(verificationStatus)}
          </span>
        </div>

        {result.proof_url && (
          <a
            href={result.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-orange-500 hover:text-orange-600 underline underline-offset-2 transition-colors"
          >
            View proof →
          </a>
        )}
      </div>

      {/* Notes */}
      {result.result_notes && (
        <div className="px-5 py-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Notes
          </p>
          <p className="text-sm text-zinc-600 leading-relaxed italic">
            {result.result_notes}
          </p>
        </div>
      )}

    </div>
  );
}
