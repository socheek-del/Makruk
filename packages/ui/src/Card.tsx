import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lifts on hover for clickable cards. */
  interactive?: boolean;
  tone?: 'default' | 'primary' | 'secondary' | 'warning' | 'danger';
}

const TONES: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'border-line bg-surface',
  primary: 'border-primary/30 bg-primary-soft',
  secondary: 'border-secondary/30 bg-secondary-soft',
  warning: 'border-warning/40 bg-warning-soft',
  danger: 'border-danger/30 bg-danger-soft',
};

export function Card({ interactive, tone = 'default', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.25rem] border p-4 shadow-card',
        TONES[tone],
        interactive && 'cursor-pointer transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-surface-2 active:translate-y-0',
        className,
      )}
      {...props}
    />
  );
}
