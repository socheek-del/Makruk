import { type Piece, sittuyin } from '@chaturanga/sittuyin';
import { Badge, Button, type ButtonVariant, Card, ProgressBar, SegmentedControl, Switch } from '@chaturanga/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Board } from './features/board/Board';
import { PieceSvg } from './features/board/PieceSvg';
import { BOARD_THEMES, boardTheme } from './features/board/themes';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'danger', 'warning', 'ghost'];
const SWATCHES = ['canvas', 'surface-2', 'line', 'ink', 'muted', 'primary', 'secondary', 'danger', 'warning', 'gold'];
const TYPES = ['k', 'f', 's', 'n', 'r', 'p'] as const;

/**
 * A fully set-up board for the showcase. The position is played out by the engine rather than written by
 * hand, so it is always legal: place the first legal piece from hand until both hands are empty.
 */
function sampleBoard() {
  const game = sittuyin.createGame();
  for (let i = 0; i < 64 && game.hand('w').length + game.hand('b').length > 0; i++) {
    const drop = game.legalUci().find((uci) => uci.includes('@'));
    if (!drop) break;
    game.move(drop);
  }
  return game.pieces();
}

function Showcase({ theme }: { theme: 'light' | 'dark' }) {
  const { t } = useTranslation();
  const [on, setOn] = useState(true);
  const [segment, setSegment] = useState<'a' | 'b'>('a');
  const pieces = sampleBoard();

  return (
    <div data-theme={theme} data-testid={`showcase-${theme}`} className="bg-canvas text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <header className="motif-daung relative overflow-hidden rounded-[1.5rem] bg-primary p-6 text-on-accent">
          <h2 className="text-2xl font-extrabold">{t('brand')}</h2>
          <p className="max-w-md opacity-90">{t('design.intro')}</p>
        </header>

        <section>
          <h3 className="mb-2 font-extrabold">{t('design.swatches')}</h3>
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((name) => (
              <div key={name} className="flex flex-col items-center gap-1">
                {/* Read straight from the variable: Tailwind cannot generate a class from a runtime name. */}
                <span className="h-12 w-12 rounded-xl border border-line" data-swatch={name} style={{ background: `var(--${name})` }} />
                <span className="text-xs text-muted">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-extrabold">{t('design.typography')}</h3>
          <Card className="flex flex-col gap-1">
            <p className="text-2xl font-extrabold">{t('design.typographySample')}</p>
            <p className="text-base">{t('design.typographySample')}</p>
            <p className="text-sm text-muted">Sittuyin · စစ်တုရင် · 0123456789</p>
          </Card>
        </section>

        <section>
          <h3 className="mb-2 font-extrabold">{t('design.buttons')}</h3>
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-extrabold">{t('design.pieces')}</h3>
          <Card className="flex flex-col gap-3">
            {(['w', 'b'] as const).map((color) => (
              <div key={color} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-16 text-sm text-muted">{t(`colors.${color}`)}</span>
                {TYPES.map((type) => (
                  <span key={type} className="flex flex-col items-center">
                    {/* 40px is the square size a phone board uses: the silhouettes must separate here. */}
                    <PieceSvg piece={{ color, type, promoted: false } as Piece} className="h-10 w-10" />
                    <span className="text-[0.65rem] text-muted">{t(`pieces.${type}`)}</span>
                  </span>
                ))}
                <span className="flex flex-col items-center">
                  <PieceSvg piece={{ color, type: 'f', promoted: true } as Piece} className="h-10 w-10" />
                  <span className="text-[0.65rem] text-muted">+</span>
                </span>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <h3 className="mb-2 font-extrabold">{t('design.boards')}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BOARD_THEMES.map((bt) => (
              <div key={bt.id} className="flex flex-col gap-1">
                <Board pieces={pieces} theme={bt} showCoordinates={false} />
                <span className="text-xs text-muted">{bt.id}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-extrabold">{t('design.cards')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="primary" className="flex items-center justify-between">
              <span className="font-extrabold">{t('design.sample')}</span>
              <Badge tone="primary">{t('design.sample')}</Badge>
            </Card>
            <Card tone="warning" className="flex items-center justify-between">
              <span className="font-extrabold">{t('design.sample')}</span>
              <Badge tone="gold">{t('design.sample')}</Badge>
            </Card>
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-extrabold">{t('design.controls')}</h3>
          <Card className="flex flex-col gap-3">
            <SegmentedControl
              value={segment}
              onChange={setSegment}
              label={t('design.controls')}
              options={[
                { value: 'a', label: t('colors.w') },
                { value: 'b', label: t('colors.b') },
              ]}
            />
            <div className="flex items-center gap-3">
              <Switch checked={on} onChange={setOn} label={t('design.controls')} />
              <ProgressBar value={0.62} label={t('design.sample')} tone="gold" className="flex-1" />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

/** sit-005: both colour schemes on one page, so the identity can be reviewed and screenshotted. */
export function DesignPage() {
  const { t } = useTranslation();
  const { id } = boardTheme('lacquer');
  return (
    <main>
      <h1 className="sr-only">
        {t('brand')} — {t('design.title')} ({id})
      </h1>
      <Showcase theme="light" />
      <Showcase theme="dark" />
    </main>
  );
}
