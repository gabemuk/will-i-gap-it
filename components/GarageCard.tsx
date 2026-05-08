import { ReactNode } from 'react';

interface GarageCardProps {
  children: ReactNode;
  /** Extra Tailwind classes */
  className?: string;
  /** Show an orange glow border instead of the default subtle border */
  glow?: boolean;
  /** Tailwind padding class, defaults to p-5 */
  padding?: string;
}

/**
 * Brushed-metal / garage-panel card.
 * Use `glow` for featured/result cards that should pop with an orange accent.
 */
export default function GarageCard({
  children,
  className = '',
  glow = false,
  padding = 'p-5',
}: GarageCardProps) {
  const border = glow
    ? 'border glow-border-orange'
    : 'border border-zinc-800/80';

  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 ${border} ${padding} ${className}`}
    >
      {children}
    </div>
  );
}
