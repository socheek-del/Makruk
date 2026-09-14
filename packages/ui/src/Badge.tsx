import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'primary' | 'secondary' | 'warning' | 'danger' | 'gold';
}

const TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-surface-2 text-muted',
  primary: 'bg-primary-soft text-primary-shadow dark:text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  warning: 'bg-warning-soft text-warning-shadow dark:text-warning',
  danger: 'bg-danger-soft text-danger',
  gold: 'bg-gold text-on-gold',
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', TONES[tone], className)}
      {...props}
    />
  );
}
