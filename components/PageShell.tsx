import Link from 'next/link';
import AuthNav from '@/components/AuthNav';

interface PageShellProps {
  children: React.ReactNode;
  /** Tailwind max-width class, defaults to max-w-5xl */
  maxWidth?: string;
}

/**
 * Shared garage-themed page wrapper.
 * Provides: dark carbon-fiber background, sticky top nav, bottom footer privacy note.
 * Used by the homepage and any page that wants the full chrome.
 */
export default function PageShell({ children, maxWidth = 'max-w-5xl' }: PageShellProps) {
  return (
    <div className="garage-bg min-h-screen flex flex-col text-white">

      {/* ── Top nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur-sm">
        <div className={`${maxWidth} mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap`}>
          <Link
            href="/"
            className="text-orange-500 font-black text-lg tracking-tight hover:text-orange-400 transition-colors"
          >
            Will I Gap It?
          </Link>
          <div className="flex items-center gap-5 flex-wrap">
            <Link
              href="/results"
              className="text-xs text-zinc-400 hover:text-orange-400 transition-colors hidden sm:block"
            >
              Community Results
            </Link>
            <Link
              href="/leaderboard"
              className="text-xs text-zinc-400 hover:text-orange-400 transition-colors"
            >
              Leaderboard
            </Link>
            <AuthNav />
          </div>
        </div>
      </nav>

      {/* ── Page content ────────────────────────────────────────── */}
      <main className="flex-1">
        <div className={`${maxWidth} mx-auto px-4 py-10`}>
          {children}
        </div>
      </main>

      {/* ── Footer privacy note ──────────────────────────────────── */}
      <footer className="border-t border-zinc-800/50 py-6 mt-4">
        <div className={`${maxWidth} mx-auto px-4`}>
          <p className="text-center text-zinc-600 text-xs leading-relaxed">
            No real names, plates, locations, or public emails required.
            Proof links are optional. Email is only used for login and recovery.
          </p>
          <p className="text-center text-zinc-700 text-xs mt-1.5">
            For closed-course and track comparison only. Results are estimates and do not guarantee real-world outcomes.
          </p>
        </div>
      </footer>

    </div>
  );
}
