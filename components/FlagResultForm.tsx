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
      <div className="mt-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
        Thanks. This result was flagged for review.
      </div>
    );
  }

  // ── Idle — just a small trigger link ──
  if (formState === 'idle') {
    return (
      <button
        onClick={handleOpen}
        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-2 mt-2"
      >
        Something wrong? Flag result
      </button>
    );
  }

  // ── Open / submitting / error — inline light panel ──
  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3"
    >
      <p className="font-display text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        Flag Result
      </p>

      <p className="text-xs text-zinc-500">
        Help keep the dataset clean. Do not include plates, addresses, phone numbers, or private personal info.
      </p>

      <div>
        <label
          className="block text-xs font-medium text-zinc-500 mb-1.5"
          htmlFor={`flag-reason-${raceResultId}`}
        >
          Reason <span className="text-orange-500">*</span>
        </label>
        <select
          id={`flag-reason-${raceResultId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value as ResultReportReason)}
          required
          className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors cursor-pointer"
        >
          <option value="" disabled>Select a reason…</option>
          {RESULT_REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-xs font-medium text-zinc-500 mb-1.5"
          htmlFor={`flag-note-${raceResultId}`}
        >
          Additional details{' '}
          <span className="text-zinc-400 font-normal">(optional, max 500 chars)</span>
        </label>
        <textarea
          id={`flag-note-${raceResultId}`}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="Briefly describe the issue…"
          className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors placeholder:text-zinc-400 resize-none"
        />
        {note.length > 400 && (
          <p className="text-xs text-zinc-400 mt-0.5 text-right">{note.length}/500</p>
        )}
      </div>

      {formState === 'error' && errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!reason || formState === 'submitting'}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors bg-[var(--color-accent)] hover:bg-orange-600 text-white disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
        >
          {formState === 'submitting' ? 'Submitting…' : 'Submit flag'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded-lg border border-zinc-200 text-xs text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
