'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    // Read query params directly — avoids Suspense requirement from useSearchParams
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // PKCE flow: exchange the one-time code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ error: authError }) => {
        if (authError) {
          setError('Login link was invalid or has expired. Please request a new one.');
        } else {
          router.replace('/account');
        }
      });
      return;
    }

    // Implicit flow: the Supabase client processes the hash automatically.
    // Listen for SIGNED_IN, then redirect.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/account');
      }
    });

    // Also check whether a session is already active
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/account');
      }
    });

    // Fallback: if nothing resolves in 8 s, show an error
    const timeout = setTimeout(() => {
      setError('Login link was invalid or has expired. Please request a new one.');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Link
            href="/"
            className="text-orange-500 font-black text-2xl hover:text-orange-400 transition-colors block mb-6"
          >
            Will I Gap It?
          </Link>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition-colors text-sm"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-400 animate-pulse text-sm">Signing you in…</p>
      </div>
    </main>
  );
}
