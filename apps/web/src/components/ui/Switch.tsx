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
        'relative h-8 w-14 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30',
        checked ? 'border-transparent bg-primary' : 'border-line bg-surface-2',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-[left] duration-150',
          checked ? 'left-[27px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}
