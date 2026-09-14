import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-accent border-transparent shadow-card hover:brightness-110',
  secondary: 'bg-secondary text-on-accent border-transparent shadow-card hover:brightness-110',
  outline: 'bg-surface text-primary border-line hover:bg-surface-2',
  danger: 'bg-danger text-on-accent border-transparent shadow-card hover:brightness-110',
  warning: 'bg-warning text-[#2b2006] border-transparent shadow-card hover:brightness-105',
  ghost: 'bg-transparent text-primary border-transparent hover:bg-surface-2',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-7 text-lg',
  icon: 'h-11 w-11 p-0',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

/** Pill button (apps/makruk/docs/design.md): soft shadow, lifts slightly on hover and settles when pressed. */
export function buttonClasses({ variant = 'primary', size = 'md', block, className }: ButtonStyleOptions = {}) {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-full border font-semibold',
    'transition-[transform,filter,background-color,box-shadow] duration-150 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Omit<ButtonStyleOptions, 'className'> {}

export function Button({ variant, size, block, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, block, className })} {...props} />;
}
