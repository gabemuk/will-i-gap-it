'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CompareResult, VerificationStatus } from '@/lib/types';

const ACTUAL_GAPS = [
  'Dead even',
  'Half car',
  '1 car',
  '2-3 cars',
  '4-5 cars',
  'Bus length',
];

const PROOF_TYPES = ['None', 'Video', 'Dragy', 'Time slip', 'Dyno sheet'];

interface Props {
  matchupId: string;
  predictedWinner: CompareResult['winner'];
  carAName: string;
  carBName: string;
}

export default function DidYouGapItForm({
  matchupId,
  predictedWinner,
  carAName,
  carBName,
}: Props) {
  const [actualWinner, setActualWinner] = useState('');
  const [actualGap, setActualGap] = useState('');
  const [proofType, setProofType] = useState('None');
  const [proofUrl, setProofUrl] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function computeVerificationStatus(
    type: string,
    url: string
  ): VerificationStatus {
    const trimmedUrl = url.trim();
    if (trimmedUrl) return 'proof_linked';
    if (type !== 'none') return 'proof_claimed';
    return 'unverified';
  }

  async function handleSubmit() {
    if (!actualWinner) {
      setError('Please select the actual winner.');
      return;
    }
    if (!actualGap) {
      setError('Please select the gap.');
      return;
    }

    const trimmedUrl = proofUrl.trim();
    if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setError('Proof URL must start with http:// or https://');
      return;
    }

    let predictionWasCorrect = false;
    if (predictedWinner === 'Too close' && actualWinner === 'Too close / tie') {
      predictionWasCorrect = true;
    } else if (predictedWinner === 'Car A' && actualWinner === 'Car A') {
      predictionWasCorrect = true;
    } else if (predictedWinner === 'Car B' && actualWinner === 'Car B') {
      predictionWasCorrect = true;
    }

    const normalizedProofType = proofType.toLowerCase().replace(/ /g, '_');
    const verificationStatus = computeVerificationStatus(normalizedProofType, trimmedUrl);

    setSubmitting(true);
    setError('');

    // Guard: check for an existing result before inserting
    const { data: existing } = await supabase
      .from('race_results')
      .select('id')
      .eq('matchup_id', matchupId)
      .maybeSingle();

    if (existing) {
      setSubmitting(false);
      setError('A result has already been submitted for this matchup. Refresh the page to see it.');
      return;
    }

    const { error: dbError } = await supabase.from('race_results').insert({
      matchup_id: matchupId,
      actual_winner: actualWinner,
      actual_gap: actualGap,
      proof_type: normalizedProofType,
      proof_url: trimmedUrl || null,
      verification_status: verificationStatus,
      result_notes: resultNotes.trim() || null,
      prediction_was_correct: predictionWasCorrect,
    });

    setSubmitting(false);

    if (dbError) {
      setError('Could not save your result. Please try again.');
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-6 text-center">
        <p className="text-green-400 font-bold text-lg mb-1">Result Submitted!</p>
        <p className="text-zinc-400 text-sm">
          Thanks for reporting back. Your result has been saved.
        </p>
      </div>
    );
  }

  const sel =
    'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors cursor-pointer';
  const lbl = 'block text-xs font-medium text-zinc-400 mb-1';

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">
        Did You Gap It?
      </h3>
      <p className="text-zinc-400 text-sm mb-5">
        Report the actual result from the track.
      </p>

      <div className="space-y-4">
        <div>
          <label className={lbl}>Actual Winner</label>
          <select
            className={sel}
            value={actualWinner}
            onChange={(e) => setActualWinner(e.target.value)}
          >
            <option value="">Select winner...</option>
            <option value="Car A">{carAName} (Car A)</option>
            <option value="Car B">{carBName} (Car B)</option>
            <option value="Too close / tie">Too close / tie</option>
          </select>
        </div>

        <div>
          <label className={lbl}>Actual Gap</label>
          <select
            className={sel}
            value={actualGap}
            onChange={(e) => setActualGap(e.target.value)}
          >
            <option value="">Select gap...</option>
            {ACTUAL_GAPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Proof Type</label>
          <select
            className={sel}
            value={proofType}
            onChange={(e) => setProofType(e.target.value)}
          >
            {PROOF_TYPES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Proof URL (optional)</label>
          <input
            type="url"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="https://youtube.com/... or https://dragy.com/..."
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
          />
          <p className="text-xs text-zinc-600 mt-1">
            YouTube, Dragy, Instagram, or any direct link. Must start with https://.
          </p>
        </div>

        <div>
          <label className={lbl}>Notes (optional)</label>
          <textarea
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            placeholder="Any notes about the run..."
            value={resultNotes}
            onChange={(e) => setResultNotes(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 text-red-400 text-sm bg-red-950/40 border border-red-700/40 rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-5 w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors"
      >
        {submitting ? 'Saving...' : 'Submit Result'}
      </button>
    </div>
  );
}
