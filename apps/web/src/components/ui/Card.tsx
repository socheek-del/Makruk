import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the pressable bottom border and hover state. */
  interactive?: boolean;
  tone?: 'default' | 'primary' | 'secondary' | 'warning' | 'danger';
}

const TONES: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'border-line bg-surface',
  primary: 'border-primary bg-primary-soft',
  secondary: 'border-secondary bg-secondary-soft',
  warning: 'border-warning bg-warning-soft',
  danger: 'border-danger bg-danger-soft',
};

export function Card({ interactive, tone = 'default', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-4',
        TONES[tone],
        interactive && 'cursor-pointer border-b-4 transition hover:bg-surface-2 active:translate-y-0.5 active:border-b-2',
        className,
      )}
      {...props}
    />
  );
}
