import { Badge, Button, type ButtonVariant, Card, Modal, ProgressBar, SegmentedControl, Switch } from '@chaturanga/ui';
import { Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'danger', 'warning', 'ghost'];
const SWATCHES = ['canvas', 'surface-2', 'line', 'ink', 'muted', 'primary', 'secondary', 'danger', 'warning', 'gold'];

function Showcase({ theme }: { theme: 'light' | 'dark' }) {
  const { t } = useTranslation();
  const [on, setOn] = useState(true);
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a');
  const [open, setOpen] = useState(false);

  return (
    <section
      data-theme={theme}
      data-testid={`showcase-${theme}`}
      aria-label={t(`design.${theme}`)}
      className="flex min-w-0 flex-col gap-6 rounded-3xl border-2 border-line bg-canvas p-4 text-ink sm:p-6"
    >
      <h2 className="text-2xl font-extrabold">{t(`design.${theme}`)}</h2>

      <div className="flex flex-col gap-2">
        <h3 className="font-extrabold text-muted">{t('design.colors')}</h3>
        <div className="grid grid-cols-5 gap-2">
          {SWATCHES.map((name) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <span className="h-10 w-full rounded-xl border-2 border-line" style={{ background: `var(--${name})` }} />
              <span className="text-[10px] text-muted">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-muted">{t('design.buttons')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} data-testid={`button-${variant}`}>
              {t(`design.variant.${variant}`)}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">{t('design.small')}</Button>
          <Button size="lg">{t('design.large')}</Button>
          <Button size="icon" variant="outline" aria-label={t('design.icon')}>
            <Star aria-hidden className="h-5 w-5" />
          </Button>
          <Button disabled>{t('design.disabled')}</Button>
        </div>
        <Button block size="lg">
          {t('design.block')}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-muted">{t('design.cards')}</h3>
        <Card interactive>
          <p className="font-extrabold">{t('design.cardTitle')}</p>
          <p className="text-sm text-muted">{t('design.cardBody')}</p>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card tone="secondary" className="font-bold text-secondary-shadow dark:text-secondary">
            {t('design.correct')}
          </Card>
          <Card tone="danger" className="font-extrabold text-danger">
            {t('design.incorrect')}
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-muted">{t('design.progress')}</h3>
        <ProgressBar value={0.3} label={t('design.progress')} />
        <ProgressBar value={0.7} tone="gold" label={t('design.progress')} />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-muted">{t('design.controls')}</h3>
        <label className="flex items-center justify-between gap-4 font-bold">
          {t('design.switchLabel')}
          <Switch checked={on} onChange={setOn} label={t('design.switchLabel')} />
        </label>
        <SegmentedControl
          label={t('design.segmented')}
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'a', label: t('design.optionA') },
            { value: 'b', label: t('design.optionB') },
            { value: 'c', label: t('design.optionC') },
          ]}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-muted">{t('design.badges')}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">{t('design.variant.primary')}</Badge>
          <Badge tone="secondary">{t('design.variant.secondary')}</Badge>
          <Badge tone="warning">{t('design.variant.warning')}</Badge>
          <Badge tone="danger">{t('design.variant.danger')}</Badge>
          <Badge tone="gold">
            <Sparkles aria-hidden className="h-3 w-3" /> 20 XP
          </Badge>
        </div>
      </div>

      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t('design.openDialog')}
        </Button>
        <Modal open={open} onClose={() => setOpen(false)} title={t('design.dialogTitle')}>
          <p className="mb-5 text-muted">{t('design.dialogBody')}</p>
          <Button block onClick={() => setOpen(false)}>
            {t('design.close')}
          </Button>
        </Modal>
      </div>
    </section>
  );
}

export function DesignPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t('design.title')}</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Showcase theme="light" />
        <Showcase theme="dark" />
      </div>
    </div>
  );
}
