import { cn } from '../../lib/cn';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  label: string;
  tone?: 'primary' | 'gold' | 'secondary';
  className?: string;
}

const FILL = { primary: 'bg-primary', gold: 'bg-gold', secondary: 'bg-secondary' } as const;

export function ProgressBar({ value, label, tone = 'primary', className }: ProgressBarProps) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('h-4 w-full overflow-hidden rounded-full bg-line', className)}
    >
      <div
        className={cn('relative h-full rounded-full transition-[width] duration-500 ease-out', FILL[tone])}
        style={{ width: `${pct}%` }}
      >
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
