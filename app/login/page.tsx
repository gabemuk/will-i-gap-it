'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ── Auth logic is UNCHANGED. Only visual markup has been updated. ──

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || 'Could not send login link. Please try again.');
      return;
    }

    setSent(true);
  }

  return (
    <main className="garage-bg min-h-screen text-white flex flex-col items-center justify-center px-4 py-14">
      <div className="w-full max-w-sm">

        {/* ── Logo / brand ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-orange-500 font-black text-2xl tracking-tight hover:text-orange-400 transition-colors"
          >
            Will I Gap It?
          </Link>
          <p className="text-zinc-600 text-xs mt-1 tracking-widest uppercase">
            Closed-Course Matchup Calculator
          </p>
        </div>

        {/* ── Garage membership card ────────────────────────────── */}
        <div className="relative rounded-xl border glow-border-orange bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-7">

          {/* Decorative top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-orange-500/35 to-transparent pointer-events-none" />

          <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
            Enter the Garage
          </h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            No password needed. We&apos;ll send a secure login link to your email.
          </p>

          {sent ? (
            /* ── Success state ───────────────────────────────────── */
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-900/40 border border-green-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-400 font-semibold mb-2">
                Check your email for the login link.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Click the link in your inbox to sign in. It will expire after a short time.
              </p>
            </div>
          ) : (
            /* ── Form ───────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.15)] transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-950/40 border border-red-700/40 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors shadow-[0_2px_14px_rgba(249,115,22,0.28)]"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          {/* Privacy copy */}
          <p className="text-xs text-zinc-600 mt-5 text-center leading-relaxed">
            No real names, plates, or locations required.
            Your email is only used for login and recovery.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors"
          >
            Back to calculator
          </Link>
        </div>

      </div>
    </main>
  );
}
