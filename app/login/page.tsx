'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PageShell from '@/components/PageShell';

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
    <PageShell variant="light">
      <div className="flex justify-center py-8">
        <div className="w-full max-w-sm">

          {/* ── Page header ─────────────────────────────────────────── */}
          <div className="text-center mb-6">
            <h1 className="font-display font-bold text-4xl uppercase tracking-tight text-zinc-900">
              Sign in
            </h1>
            <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
              Save matchups, manage your display name, and track your submitted results.
            </p>
          </div>

          {/* ── Auth card ────────────────────────────────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-xl p-7">

            <p className="text-zinc-500 text-sm mb-5 leading-relaxed">
              No password needed. We&apos;ll send a secure login link to your email.
            </p>

            {sent ? (
              /* ── Success state ──────────────────────────────────── */
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                <p className="text-green-700 font-semibold mb-2">
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
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--color-accent)] hover:bg-orange-600 active:bg-orange-700 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Magic Link'}
                </button>
              </form>
            )}

            {/* Privacy copy */}
            <p className="text-xs text-zinc-400 mt-5 text-center leading-relaxed">
              No real names, plates, or locations required.
              Your email is only used for login and recovery.
            </p>
          </div>

          {/* Back link */}
          <div className="text-center mt-4">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Back to calculator
            </Link>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
