import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-accent border-primary-shadow hover:brightness-105',
  secondary: 'bg-secondary text-on-accent border-secondary-shadow hover:brightness-105',
  outline: 'bg-surface text-secondary border-line hover:bg-surface-2',
  danger: 'bg-danger text-white border-danger-shadow hover:brightness-105',
  warning: 'bg-warning text-[#4b3a00] border-warning-shadow hover:brightness-105',
  ghost: 'bg-transparent text-secondary border-transparent hover:bg-surface-2',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-6 text-lg',
  icon: 'h-11 w-11 p-0',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

/** Duolingo-style "pressable" button: chunky bottom border that collapses when pressed. */
export function buttonClasses({ variant = 'primary', size = 'md', block, className }: ButtonStyleOptions = {}) {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-2xl border-2 border-b-4 font-extrabold tracking-wide',
    'transition-[transform,filter,background-color] duration-75 active:translate-y-0.5 active:border-b-2',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40',
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
