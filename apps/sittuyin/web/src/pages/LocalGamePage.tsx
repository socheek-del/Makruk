import { inSetupPhase, toTimeControl } from '@chaturanga/game-shell';
import { TimeControlPicker } from '@chaturanga/game-shell/ui';
import type { Color } from '@chaturanga/sittuyin';
import { Button, Card } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';
import { autoArrange } from '../features/game/autoArrange';
import { GameScreen, undoAllowed } from '../features/game/GameScreen';
import { useLocalSession } from '../stores/localSession';
import { useSettings } from '../stores/settings';

export function LocalGamePage() {
  const phase = useLocalSession((s) => s.phase);
  return phase === 'setup' ? <LocalSetup /> : <LocalGame />;
}

function LocalSetup() {
  const { t } = useTranslation();
  const choice = useSettings((s) => s.timeControl);
  const update = useSettings((s) => s.update);
  const start = useLocalSession((s) => s.start);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('modes.local')}</h1>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">{t('play.timeControl')}</h2>
        <p className="text-sm text-muted">{t('setup.clocksWait')}</p>
        <TimeControlPicker value={choice} onChange={(timeControl) => update({ timeControl })} />
      </Card>
      <Button size="lg" block onClick={() => start(toTimeControl(choice))}>
        {t('play.start')}
      </Button>
    </div>
  );
}

function LocalGame() {
  const { t } = useTranslation();
  const game = useLocalSession((s) => s.game);
  const result = useLocalSession((s) => s.result);
  const flipped = useLocalSession((s) => s.flipped);
  useLocalSession((s) => s.version);

  const orientation: Color = flipped ? 'b' : 'w';
  const placing = inSetupPhase(game);

  return (
    <GameScreen
      useSession={useLocalSession}
      title={t('modes.local')}
      orientation={orientation}
      names={{ w: t('play.white'), b: t('play.black') }}
      inputEnabled
      canUndo={undoAllowed({ game, result })}
      onUndo={() => useLocalSession.getState().undo()}
      resignColor={game.turn}
      actions={
        placing && (
          <Button
            variant="secondary"
            data-testid="auto-arrange"
            onClick={() => autoArrange(game, (uci) => useLocalSession.getState().move(uci), () => true)}
          >
            {t('setup.autoArrange')}
          </Button>
        )
      }
      onRematch={() => {
        const { start, timeControl } = useLocalSession.getState();
        start(timeControl);
      }}
    />
  );
}
