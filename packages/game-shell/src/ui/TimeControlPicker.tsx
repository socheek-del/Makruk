import { cn } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';
import { CUSTOM_LIMITS, PRESETS, TIME_CATEGORIES, type TimeControlChoice } from '../timeControls';

export interface TimeControlPickerProps {
  value: TimeControlChoice;
  onChange: (choice: TimeControlChoice) => void;
}

function Option({ id, label, checked, onSelect }: { id: string; label: string; checked: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-time-control={id}
      onClick={onSelect}
      className={cn(
        'min-h-11 rounded-full border px-2 font-semibold tabular-nums transition-colors',
        checked ? 'border-primary bg-primary-soft text-primary ring-1 ring-primary' : 'border-line bg-surface text-ink hover:bg-surface-2',
      )}
    >
      {label}
    </button>
  );
}

export function TimeControlPicker({ value, onChange }: TimeControlPickerProps) {
  const { t } = useTranslation();
  const custom = value.kind === 'custom' ? value : { kind: 'custom' as const, minutes: 10, increment: 0 };

  return (
    <div role="radiogroup" aria-label={t('play.timeControl')} className="flex flex-col gap-4">
      {TIME_CATEGORIES.map((category) => (
        <div key={category} className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-muted">{t(`play.categories.${category}`)}</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {PRESETS.filter((p) => p.category === category).map((p) => (
              <Option
                key={p.id}
                id={p.id}
                label={p.id}
                checked={value.kind === 'preset' && value.id === p.id}
                onSelect={() => onChange({ kind: 'preset', id: p.id })}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <Option id="none" label={t('play.noClock')} checked={value.kind === 'none'} onSelect={() => onChange({ kind: 'none' })} />
        <Option id="custom" label={t('play.custom')} checked={value.kind === 'custom'} onSelect={() => onChange(custom)} />
      </div>
      {value.kind === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-bold">
            {t('play.minutes')}
            <input
              type="number"
              inputMode="numeric"
              min={CUSTOM_LIMITS.minMinutes}
              max={CUSTOM_LIMITS.maxMinutes}
              value={value.minutes}
              onChange={(e) => onChange({ ...value, minutes: Number(e.target.value) })}
              className="h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            {t('play.increment')}
            <input
              type="number"
              inputMode="numeric"
              min={CUSTOM_LIMITS.minIncrement}
              max={CUSTOM_LIMITS.maxIncrement}
              value={value.increment}
              onChange={(e) => onChange({ ...value, increment: Number(e.target.value) })}
              className="h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink"
            />
          </label>
        </div>
      )}
    </div>
  );
}
