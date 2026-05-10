'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RESULT_REPORT_REASONS } from '@/lib/reportReasons';
import type { ResultReportReason } from '@/lib/types';

interface Props {
  raceResultId: string;
}

type FormState = 'idle' | 'open' | 'submitting' | 'success' | 'error';

export default function FlagResultForm({ raceResultId }: Props) {
  const [formState, setFormState] = useState<FormState>('idle');
  const [reason, setReason] = useState<ResultReportReason | ''>('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function handleOpen() {
    setFormState('open');
    setReason('');
    setNote('');
    setErrorMsg('');
  }

  function handleCancel() {
    setFormState('idle');
    setReason('');
    setNote('');
    setErrorMsg('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;

    setFormState('submitting');
    setErrorMsg('');

    try {
      // Get current user if logged in — never required.
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('result_reports').insert({
        race_result_id:     raceResultId,
        reason,
        note:               note.trim() || null,
        reporter_user_id:   user?.id ?? null,
        reporter_fingerprint: null,
      });

      if (error) {
        console.error('FlagResultForm insert error:', error);

        // Table may not exist yet (migration not yet run).
        if (
          error.code === '42P01' || // undefined_table
          error.message?.toLowerCase().includes('does not exist')
        ) {
          setErrorMsg('Flagging is not available yet. Try again later.');
        } else {
          setErrorMsg('Something went wrong. Please try again.');
        }
        setFormState('error');
        return;
      }

      setFormState('success');
    } catch (err) {
      console.error('FlagResultForm unexpected error:', err);
      setErrorMsg('Flagging is not available yet. Try again later.');
      setFormState('error');
    }
  }

  // ── Success state ──
  if (formState === 'success') {
    return (
      <div className="mt-3 px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-400">
        Thanks. This result was flagged for review.
      </div>
    );
  }

  // ── Idle — just a small trigger link ──
  if (formState === 'idle') {
    return (
      <button
        onClick={handleOpen}
        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2 mt-2"
      >
        Something wrong? Flag result
      </button>
    );
  }

  // ── Open / submitting / error — inline form ──
  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Flag result</p>
        <button
          type="button"
          onClick={handleCancel}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Help keep the dataset clean. Do not include plates, addresses, phone numbers, or private personal info.
      </p>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5" htmlFor={`flag-reason-${raceResultId}`}>
          Reason <span className="text-red-400">*</span>
        </label>
        <select
          id={`flag-reason-${raceResultId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value as ResultReportReason)}
          required
          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
        >
          <option value="" disabled>Select a reason…</option>
          {RESULT_REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5" htmlFor={`flag-note-${raceResultId}`}>
          Additional details <span className="text-zinc-600">(optional, max 500 chars)</span>
        </label>
        <textarea
          id={`flag-note-${raceResultId}`}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="Briefly describe the issue…"
          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 resize-none"
        />
        {note.length > 400 && (
          <p className="text-xs text-zinc-600 mt-0.5 text-right">{note.length}/500</p>
        )}
      </div>

      {formState === 'error' && errorMsg && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!reason || formState === 'submitting'}
          className="flex-1 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-200 transition-colors"
        >
          {formState === 'submitting' ? 'Submitting…' : 'Submit flag'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
