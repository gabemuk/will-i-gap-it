import { ReactNode } from 'react';

type GarageCardVariant = 'default' | 'inset' | 'result';

interface GarageCardProps {
  children: ReactNode;
  className?: string;
  /** Visual variant. 'result' applies the orange accent border + glow. Default: 'default'. */
  variant?: GarageCardVariant;
  /**
   * @deprecated Use variant="result" instead.
   * Preserved for backward compatibility — treated as variant="result".
   */
  glow?: boolean;
  /** Tailwind padding class, defaults to p-5 */
  padding?: string;
}

const variantClasses: Record<GarageCardVariant, string> = {
  default: 'bg-[var(--color-surface-1)] border border-[var(--color-border)]',
  inset:   'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
  result:  'bg-[var(--color-surface-1)] border glow-border-orange',
};

export default function GarageCard({
  children,
  className = '',
  variant = 'default',
  glow = false,
  padding = 'p-5',
}: GarageCardProps) {
  const resolvedVariant: GarageCardVariant = glow ? 'result' : variant;

  return (
    <div className={`rounded-xl ${variantClasses[resolvedVariant]} ${padding} ${className}`}>
      {children}
    </div>
  );
}
