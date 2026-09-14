import { Card, cn, SegmentedControl, Switch } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';
import { type Language, PRODUCT } from '../../product.config';
import { PieceSvg } from '../features/board/PieceSvg';
import { BOARD_THEMES, type BoardTheme } from '../features/board/themes';
import { type ColorScheme, useSettings } from '../stores/settings';

function BoardSwatch({ theme }: { theme: BoardTheme }) {
  return (
    <div
      aria-hidden
      className="grid aspect-square w-full grid-cols-4 grid-rows-4 gap-px rounded-lg border-2 p-px"
      style={{ background: theme.line, borderColor: theme.line }}
    >
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} className="relative" style={{ background: i === 6 ? theme.lastMove : theme.board }}>
          {i === 5 && <PieceSvg piece={{ color: 'b', type: 'n', promoted: false }} className="absolute inset-[6%]" />}
        </span>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const settings = useSettings();
  const { update } = settings;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('nav.settings')}</h1>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('settings.language')}</h2>
        <SegmentedControl<Language>
          label={t('settings.language')}
          value={settings.language}
          onChange={(language) => update({ language })}
          options={PRODUCT.locales.map((code) => ({ value: code, label: PRODUCT.languageNames[code] }))}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('settings.appearance')}</h2>
        <SegmentedControl<ColorScheme>
          label={t('settings.appearance')}
          value={settings.colorScheme}
          onChange={(colorScheme) => update({ colorScheme })}
          options={[
            { value: 'system', label: t('settings.system') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('settings.board')}</h2>
        <div role="radiogroup" aria-label={t('settings.board')} className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {BOARD_THEMES.map((theme) => {
            const checked = theme.id === settings.boardTheme;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={t(`boards.${theme.id}`)}
                data-board-theme={theme.id}
                onClick={() => update({ boardTheme: theme.id })}
                className={cn('rounded-xl p-1 transition-colors', checked ? 'bg-primary-soft ring-2 ring-primary' : 'hover:bg-surface-2')}
              >
                <BoardSwatch theme={theme} />
                <span className="mt-1 block text-xs font-semibold">{t(`boards.${theme.id}`)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">{t('settings.play')}</h2>
        <label className="flex items-center justify-between gap-3">
          <span className="font-semibold">{t('settings.coordinates')}</span>
          <Switch
            checked={settings.showCoordinates}
            onChange={(showCoordinates) => update({ showCoordinates })}
            label={t('settings.coordinates')}
          />
        </label>
      </Card>
    </div>
  );
}
