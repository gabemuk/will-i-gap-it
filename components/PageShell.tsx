import Link from 'next/link';
import AuthNav from '@/components/AuthNav';

interface PageShellProps {
  children: React.ReactNode;
  /** Tailwind max-width class, defaults to max-w-5xl */
  maxWidth?: string;
}

export default function PageShell({ children, maxWidth = 'max-w-5xl' }: PageShellProps) {
  return (
    <div className="garage-bg min-h-screen flex flex-col text-white">

      {/* Top nav */}
      <nav className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[rgba(10,10,13,0.88)] backdrop-blur-sm">
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
              className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-accent)] transition-colors hidden sm:block"
            >
              Community Results
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-accent)] transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/insights"
              className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-accent)] transition-colors hidden sm:block"
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
      <footer className="border-t border-[var(--color-border)] py-6 mt-4">
        <div className={`${maxWidth} mx-auto px-4`}>
          <p className="text-center text-[var(--color-text-3)] text-xs leading-relaxed">
            No real names, plates, locations, or public emails required.
            Proof links are optional. Email is only used for login and recovery.
          </p>
          <p className="text-center text-[var(--color-text-3)] text-xs mt-1.5 opacity-60">
            For closed-course and track comparison only. Results are estimates and do not guarantee real-world outcomes.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/privacy" className="text-[var(--color-text-3)] hover:text-[var(--color-text-2)] text-xs transition-colors">
              Privacy
            </Link>
            <span className="text-[var(--color-border-mid)] text-xs">|</span>
            <Link href="/terms" className="text-[var(--color-text-3)] hover:text-[var(--color-text-2)] text-xs transition-colors">
              Terms
            </Link>
            <span className="text-[var(--color-border-mid)] text-xs">|</span>
            <Link href="/contact" className="text-[var(--color-text-3)] hover:text-[var(--color-text-2)] text-xs transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
