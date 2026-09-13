import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Switch } from '../components/ui/Switch';
import { PieceSvg } from '../features/board/PieceSvg';
import { BOARD_THEMES, type BoardTheme } from '../features/board/themes';
import { cn } from '../lib/cn';
import { type ColorScheme, type Language, useSettings } from '../stores/settings';

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
          {i === 10 && <PieceSvg piece={{ color: 'w', type: 'k', promoted: false }} className="absolute inset-[6%]" />}
        </span>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const colorScheme = useSettings((s) => s.colorScheme);
  const boardTheme = useSettings((s) => s.boardTheme);
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const update = useSettings((s) => s.update);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t('settings.title')}</h1>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('settings.language')}</h2>
        <SegmentedControl<Language>
          label={t('settings.language')}
          value={language}
          onChange={(value) => update({ language: value })}
          options={[
            { value: 'th', label: t('settings.languageTh') },
            { value: 'en', label: t('settings.languageEn') },
          ]}
        />
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-lg font-extrabold">{t('settings.appearance')}</h2>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-muted">{t('settings.colorScheme')}</h3>
          <SegmentedControl<ColorScheme>
            label={t('settings.colorScheme')}
            value={colorScheme}
            onChange={(value) => update({ colorScheme: value })}
            options={[
              { value: 'system', label: t('settings.system') },
              { value: 'light', label: t('settings.light') },
              { value: 'dark', label: t('settings.dark') },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-muted">{t('settings.boardTheme')}</h3>
          <div role="radiogroup" aria-label={t('settings.boardTheme')} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BOARD_THEMES.map((theme) => {
              const checked = theme.id === boardTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  data-board-theme={theme.id}
                  onClick={() => update({ boardTheme: theme.id })}
                  className={cn(
                    'flex flex-col gap-2 rounded-2xl border-2 border-b-4 p-2 text-sm font-extrabold transition-colors active:translate-y-0.5 active:border-b-2',
                    checked ? 'border-secondary bg-secondary-soft text-secondary' : 'border-line bg-surface hover:bg-surface-2',
                  )}
                >
                  <BoardSwatch theme={theme} />
                  {t(`settings.boardThemes.${theme.id}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 font-bold">
          <span>{t('settings.coordinates')}</span>
          <Switch checked={showCoordinates} onChange={(value) => update({ showCoordinates: value })} label={t('settings.coordinates')} />
        </div>
      </Card>
    </div>
  );
}
