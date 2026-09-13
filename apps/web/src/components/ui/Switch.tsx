import { cn } from '../../lib/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40',
        checked ? 'border-secondary-shadow bg-secondary' : 'border-line bg-surface-2',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-150',
          checked ? 'left-6.5' : 'left-0.5',
        )}
      />
    </button>
  );
}
