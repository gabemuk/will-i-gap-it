'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function AuthNav() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? (
    <Link
      href="/account"
      className="inline-block text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
    >
      Account
    </Link>
  ) : (
    <Link
      href="/login"
      className="inline-block text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
    >
      Sign in
    </Link>
  );
}
