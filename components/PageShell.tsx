import Link from 'next/link';
import AuthNav from '@/components/AuthNav';

interface PageShellProps {
  children: React.ReactNode;
  /** Tailwind max-width class, defaults to max-w-5xl */
  maxWidth?: string;
  /** 'dark' (default) keeps the current dark shell. 'light' uses the warm off-white page base. */
  variant?: 'dark' | 'light';
}

export default function PageShell({
  children,
  maxWidth = 'max-w-5xl',
  variant = 'dark',
}: PageShellProps) {
  const light = variant === 'light';

  return (
    <div className={
      light
        ? 'min-h-screen flex flex-col bg-[var(--color-page-bg)]'
        : 'garage-bg min-h-screen flex flex-col text-white'
    }>

      {/* Top nav */}
      <nav className={
        light
          ? 'sticky top-0 z-20 border-b border-[#DDD9D2] bg-[rgba(242,241,237,0.93)] backdrop-blur-sm'
          : 'sticky top-0 z-20 border-b border-[var(--color-border)] bg-[rgba(10,10,13,0.88)] backdrop-blur-sm'
      }>
        <div className={`${maxWidth} mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap`}>
          <Link
            href="/"
            className="font-display font-bold text-xl tracking-tight uppercase text-[var(--color-accent)] hover:text-orange-400 transition-colors"
          >
            Will I Gap It?
          </Link>
          <div className="flex items-center gap-5 flex-wrap">
            <Link
              href="/results"
              className={`text-sm transition-colors hidden sm:block ${
                light ? 'text-zinc-600 hover:text-[var(--color-accent)]' : 'text-[var(--color-text-2)] hover:text-[var(--color-accent)]'
              }`}
            >
              Community Results
            </Link>
            <Link
              href="/leaderboard"
              className={`text-sm transition-colors ${
                light ? 'text-zinc-600 hover:text-[var(--color-accent)]' : 'text-[var(--color-text-2)] hover:text-[var(--color-accent)]'
              }`}
            >
              Leaderboard
            </Link>
            <Link
              href="/insights"
              className={`text-sm transition-colors hidden sm:block ${
                light ? 'text-zinc-600 hover:text-[var(--color-accent)]' : 'text-[var(--color-text-2)] hover:text-[var(--color-accent)]'
              }`}
            >
              Insights
            </Link>
            <AuthNav />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <div className={`${maxWidth} mx-auto px-4 py-10`}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-6 mt-4 ${light ? 'border-t border-[#DDD9D2]' : 'border-t border-[var(--color-border)]'}`}>
        <div className={`${maxWidth} mx-auto px-4`}>
          <p className={`text-center text-xs leading-relaxed ${light ? 'text-zinc-400' : 'text-[var(--color-text-3)]'}`}>
            No real names, plates, locations, or public emails required.
            Proof links are optional. Email is only used for login and recovery.
          </p>
          <p className={`text-center text-xs mt-1.5 opacity-60 ${light ? 'text-zinc-400' : 'text-[var(--color-text-3)]'}`}>
            For closed-course and track comparison only. Results are estimates and do not guarantee real-world outcomes.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link
              href="/privacy"
              className={`text-xs transition-colors ${light ? 'text-zinc-400 hover:text-zinc-700' : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)]'}`}
            >
              Privacy
            </Link>
            <span className={`text-xs ${light ? 'text-zinc-300' : 'text-[var(--color-border-mid)]'}`}>|</span>
            <Link
              href="/terms"
              className={`text-xs transition-colors ${light ? 'text-zinc-400 hover:text-zinc-700' : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)]'}`}
            >
              Terms
            </Link>
            <span className={`text-xs ${light ? 'text-zinc-300' : 'text-[var(--color-border-mid)]'}`}>|</span>
            <Link
              href="/contact"
              className={`text-xs transition-colors ${light ? 'text-zinc-400 hover:text-zinc-700' : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)]'}`}
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
