'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getCarLabel } from '@/lib/compare';
import { formatDate, formatRaceType, formatVerificationStatus, getVerificationBadgeClass } from '@/lib/format';
import type { SavedMatchup, ResultWithMatchup } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Profile {
  id: string;
  display_name: string | null;
}

const DISPLAY_NAME_REGEX = /^[A-Za-z0-9_]+$/;

// ---------------------------------------------------------------------------
// Display name sub-form
// ---------------------------------------------------------------------------

function DisplayNameForm({
  userId,
  initialName,
}: {
  userId: string;
  initialName: string | null;
}) {
  const [name, setName] = useState(initialName ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState('');

  async function handleSave() {
    const trimmed = name.trim();
    setNameError('');
    setSaved(false);

    if (!trimmed) { setNameError('Display name is required.'); return; }
    if (trimmed.length < 3) { setNameError('Must be at least 3 characters.'); return; }
    if (trimmed.length > 24) { setNameError('Must be 24 characters or fewer.'); return; }
    if (!DISPLAY_NAME_REGEX.test(trimmed)) {
      setNameError('Only letters, numbers, and underscores allowed.');
      return;
    }

    setSaving(true);
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: trimmed, updated_at: new Date().toISOString() });
    setSaving(false);

    if (dbError) {
      setNameError('Could not save display name. Please try again.');
    } else {
      setSaved(true);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        Display name
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={24}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          placeholder="e.g. SpeedKing42"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="text-xs text-zinc-600 mt-1">3–24 characters. Letters, numbers, underscores.</p>
      {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
      {saved && <p className="text-xs text-green-400 mt-1">Display name saved.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Matchups
// ---------------------------------------------------------------------------

function MyMatchups({ userId }: { userId: string }) {
  const [matchups, setMatchups] = useState<SavedMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    supabase
      .from('matchups')
      .select('id, share_code, car_a, car_b, race_type, prediction, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error: dbError }) => {
        if (dbError) setFetchError('Could not load your matchups.');
        else setMatchups((data ?? []) as SavedMatchup[]);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p className="text-zinc-500 text-sm animate-pulse">Loading…</p>;
  if (fetchError) return <p className="text-red-400 text-sm">{fetchError}</p>;
  if (matchups.length === 0) return <p className="text-zinc-500 text-sm">No saved matchups yet.</p>;

  return (
    <div className="space-y-2">
      {matchups.map((m) => {
        const labelA = getCarLabel(m.car_a) || 'Car A';
        const labelB = getCarLabel(m.car_b) || 'Car B';
        return (
          <Link
            key={m.id}
            href={`/matchup/${m.share_code}`}
            className="block bg-zinc-800/60 hover:bg-zinc-800 rounded-lg px-4 py-3 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  <span className="text-orange-500">{labelA}</span>
                  <span className="text-zinc-600 mx-1.5">vs</span>
                  <span className="text-orange-400">{labelB}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatRaceType(m.race_type)} &middot; {formatDate(m.created_at)}
                </p>
              </div>
              <span className="text-xs text-orange-500 shrink-0">View →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Results
// ---------------------------------------------------------------------------

function MyResults({ userId }: { userId: string }) {
  const [results, setResults] = useState<ResultWithMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    supabase
      .from('race_results')
      .select(
        'id, matchup_id, actual_winner, actual_gap, proof_type, proof_url, verification_status, prediction_was_correct, result_notes, created_at, matchups(share_code, car_a, car_b, race_type, prediction)'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error: dbError }) => {
        if (dbError) setFetchError('Could not load your results.');
        else setResults((data ?? []) as unknown as ResultWithMatchup[]);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p className="text-zinc-500 text-sm animate-pulse">Loading…</p>;
  if (fetchError) return <p className="text-red-400 text-sm">{fetchError}</p>;
  if (results.length === 0) return <p className="text-zinc-500 text-sm">No submitted results yet.</p>;

  return (
    <div className="space-y-2">
      {results.map((r) => {
        const m = r.matchups;
        const labelA = m ? (getCarLabel(m.car_a) || 'Car A') : 'Car A';
        const labelB = m ? (getCarLabel(m.car_b) || 'Car B') : 'Car B';
        return (
          <div key={r.id} className="bg-zinc-800/60 rounded-lg px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  <span className="text-orange-500">{labelA}</span>
                  <span className="text-zinc-600 mx-1.5">vs</span>
                  <span className="text-orange-400">{labelB}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Winner: <span className="text-zinc-300">{r.actual_winner}</span>
                  &nbsp;&middot;&nbsp;
                  Gap: <span className="text-zinc-300">{r.actual_gap}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getVerificationBadgeClass(r.verification_status)}`}
                  >
                    {formatVerificationStatus(r.verification_status)}
                  </span>
                  {r.proof_url && (
                    <a
                      href={r.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                      View proof
                    </a>
                  )}
                </div>
                <p className="text-xs text-zinc-600 mt-1">{formatDate(r.created_at)}</p>
              </div>
              {m?.share_code && (
                <Link
                  href={`/matchup/${m.share_code}`}
                  className="text-xs text-orange-500 hover:text-orange-400 shrink-0 underline underline-offset-2 transition-colors"
                >
                  View
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Account page
// ---------------------------------------------------------------------------

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        setLoading(false);
        return;
      }
      setUser(u);
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', u.id)
        .maybeSingle();
      setProfile(data as Profile | null);
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse text-sm">Loading…</p>
      </main>
    );
  }

  // ── Not signed in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <Link
            href="/"
            className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors block mb-8"
          >
            Will I Gap It?
          </Link>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <p className="text-zinc-300 text-base font-semibold mb-2">
              Sign in to save your matchups and results.
            </p>
            <p className="text-zinc-500 text-sm mb-6">
              Create a free account to track your saved matchups and submitted results.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-center text-sm"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-5">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
            >
              Back to calculator
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Signed in ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors"
          >
            Will I Gap It?
          </Link>
        </div>

        {/* ── Profile card ──────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h1 className="text-lg font-black text-white mb-5">Account</h1>

          <DisplayNameForm
            userId={user.id}
            initialName={profile?.display_name ?? null}
          />

          <div className="mt-5 pt-5 border-t border-zinc-800">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:text-zinc-600 text-zinc-300 text-sm font-semibold rounded-lg transition-colors border border-zinc-700"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        {/* ── My Matchups ───────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-wide mb-4">
            My Matchups
          </h2>
          <MyMatchups userId={user.id} />
        </div>

        {/* ── My Results ────────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-wide mb-4">
            My Results
          </h2>
          <MyResults userId={user.id} />
        </div>

        {/* ── Footer nav ────────────────────────────────────────────────── */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
          >
            Calculator
          </Link>
          <Link
            href="/results"
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
          >
            Recent Results
          </Link>
          <Link
            href="/leaderboard"
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
          >
            Leaderboard
          </Link>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          For closed-course and track comparison only. Results are estimates and
          do not guarantee real-world outcomes.
        </p>

      </div>
    </main>
  );
}
