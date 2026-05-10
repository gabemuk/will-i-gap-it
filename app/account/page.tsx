'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getCarLabel } from '@/lib/compare';
import { formatDate, formatRaceType, formatVerificationStatus } from '@/lib/format';
import type { SavedMatchup, ResultWithMatchup } from '@/lib/types';
import PageShell from '@/components/PageShell';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Profile {
  id: string;
  display_name: string | null;
}

const DISPLAY_NAME_REGEX = /^[A-Za-z0-9_]+$/;
const INITIAL_SHOW = 5;
const LOAD_MORE_COUNT = 10;

// ---------------------------------------------------------------------------
// Light verification badge — local to avoid dark classes from lib/format.ts
// ---------------------------------------------------------------------------

function lightVerificationBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'proof_claimed':  return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'proof_linked':   return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'admin_verified': return 'bg-green-50 text-green-700 border border-green-200';
    case 'disputed':       return 'bg-red-50 text-red-700 border border-red-200';
    default:               return 'bg-zinc-100 text-zinc-500 border border-zinc-200';
  }
}

// ---------------------------------------------------------------------------
// Section title
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-zinc-100">
      <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        {children}
      </p>
    </div>
  );
}

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
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">
        Display name
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={24}
          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors"
          placeholder="e.g. SpeedKing42"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[var(--color-accent)] hover:bg-orange-600 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="text-xs text-zinc-400 mt-1.5">3–24 characters. Letters, numbers, underscores.</p>
      {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
      {saved && <p className="text-xs text-green-600 mt-1">Display name saved.</p>}
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
  const [displayCount, setDisplayCount] = useState(INITIAL_SHOW);

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

  if (loading) {
    return (
      <div className="px-5 py-4">
        <p className="text-zinc-400 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="px-5 py-4">
        <p className="text-red-600 text-sm">{fetchError}</p>
      </div>
    );
  }
  if (matchups.length === 0) {
    return (
      <div className="px-5 py-4">
        <p className="text-zinc-400 text-sm">No saved matchups yet.</p>
      </div>
    );
  }

  const visible = matchups.slice(0, displayCount);
  const hasMore = displayCount < matchups.length;
  const hasExpanded = displayCount > INITIAL_SHOW;

  return (
    <div>
      <div className="divide-y divide-zinc-100">
        {visible.map((m) => {
          const labelA = getCarLabel(m.car_a) || 'Car A';
          const labelB = getCarLabel(m.car_b) || 'Car B';
          return (
            <Link
              key={m.id}
              href={`/matchup/${m.share_code}`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-bold truncate">
                  <span className="text-[var(--color-accent)]">{labelA}</span>
                  <span className="text-zinc-400 mx-1.5 font-normal">vs</span>
                  <span className="text-zinc-700">{labelB}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatRaceType(m.race_type)} &middot; {formatDate(m.created_at)}
                </p>
              </div>
              <span className="text-xs text-orange-500 group-hover:text-orange-600 shrink-0 transition-colors">View →</span>
            </Link>
          );
        })}
      </div>
      {(hasMore || hasExpanded) && (
        <div className="flex gap-3 px-5 pt-3 pb-2 border-t border-zinc-100">
          {hasMore && (
            <button
              onClick={() => setDisplayCount((c) => c + LOAD_MORE_COUNT)}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Show more ({matchups.length - displayCount} remaining)
            </button>
          )}
          {hasExpanded && (
            <button
              onClick={() => setDisplayCount(INITIAL_SHOW)}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}
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
  const [displayCount, setDisplayCount] = useState(INITIAL_SHOW);

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

  if (loading) {
    return (
      <div className="px-5 py-4">
        <p className="text-zinc-400 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="px-5 py-4">
        <p className="text-red-600 text-sm">{fetchError}</p>
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <div className="px-5 py-4">
        <p className="text-zinc-400 text-sm">No submitted results yet.</p>
      </div>
    );
  }

  const visible = results.slice(0, displayCount);
  const hasMore = displayCount < results.length;
  const hasExpanded = displayCount > INITIAL_SHOW;

  return (
    <div>
      <div className="divide-y divide-zinc-100">
        {visible.map((r) => {
          const m = r.matchups;
          const labelA = m ? (getCarLabel(m.car_a) || 'Car A') : 'Car A';
          const labelB = m ? (getCarLabel(m.car_b) || 'Car B') : 'Car B';
          return (
            <div key={r.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-bold truncate">
                    <span className="text-[var(--color-accent)]">{labelA}</span>
                    <span className="text-zinc-400 mx-1.5 font-normal">vs</span>
                    <span className="text-zinc-700">{labelB}</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Winner: <span className="text-zinc-700">{r.actual_winner}</span>
                    &nbsp;&middot;&nbsp;
                    Gap: <span className="font-mono text-zinc-700">{r.actual_gap}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lightVerificationBadgeClass(r.verification_status)}`}>
                      {formatVerificationStatus(r.verification_status)}
                    </span>
                    {r.proof_url && (
                      <a
                        href={r.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-500 hover:text-orange-600 underline underline-offset-2 transition-colors"
                      >
                        View proof
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{formatDate(r.created_at)}</p>
                </div>
                {m?.share_code && (
                  <Link
                    href={`/matchup/${m.share_code}`}
                    className="text-xs text-orange-500 hover:text-orange-600 shrink-0 underline underline-offset-2 transition-colors"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {(hasMore || hasExpanded) && (
        <div className="flex gap-3 px-5 pt-3 pb-2 border-t border-zinc-100">
          {hasMore && (
            <button
              onClick={() => setDisplayCount((c) => c + LOAD_MORE_COUNT)}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Show more ({results.length - displayCount} remaining)
            </button>
          )}
          {hasExpanded && (
            <button
              onClick={() => setDisplayCount(INITIAL_SHOW)}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}
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
      <PageShell variant="light" maxWidth="max-w-2xl">
        <div className="flex items-center justify-center py-24">
          <p className="text-zinc-400 animate-pulse text-sm">Loading…</p>
        </div>
      </PageShell>
    );
  }

  // ── Not signed in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <PageShell variant="light" maxWidth="max-w-2xl">
        <div className="flex items-center justify-center py-16">
          <div className="bg-white border border-zinc-200 rounded-xl p-8 max-w-sm w-full text-center">
            <p className="text-zinc-800 text-base font-semibold mb-2">
              Sign in to access your account.
            </p>
            <p className="text-zinc-500 text-sm mb-6">
              Create a free account to track your saved matchups and submitted results.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-[var(--color-accent)] hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-center text-sm"
            >
              Sign in
            </Link>
            <div className="mt-4">
              <Link
                href="/"
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-2"
              >
                Back to calculator
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Signed in ────────────────────────────────────────────────────────────
  return (
    <PageShell variant="light" maxWidth="max-w-2xl">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-zinc-900">
          Account
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Manage your display name and saved activity.
        </p>
      </div>

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden mb-5">
        <SectionTitle>Profile</SectionTitle>
        <div className="px-5 py-4">
          <DisplayNameForm
            userId={user.id}
            initialName={profile?.display_name ?? null}
          />
        </div>
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-400">
            No real name, plate, or location required.
          </p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="shrink-0 px-4 py-2 bg-zinc-50 hover:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-zinc-600 text-xs font-semibold rounded-lg transition-colors border border-zinc-200"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>

      {/* ── My Matchups ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden mb-5">
        <SectionTitle>My Matchups</SectionTitle>
        <MyMatchups userId={user.id} />
      </div>

      {/* ── My Results ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <SectionTitle>My Submitted Results</SectionTitle>
        <MyResults userId={user.id} />
      </div>

    </PageShell>
  );
}
