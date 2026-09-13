import { type Color, FenError, Game } from '@makruk/engine';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Board } from '../features/board/Board';
import { boardTheme } from '../features/board/themes';
import { useMoveInput } from '../features/board/useMoveInput';
import { timesAt } from '../features/game/clock';
import { CountingIndicator } from '../features/game/CountingIndicator';
import { GameControls } from '../features/game/GameControls';
import { GameOverModal } from '../features/game/GameOverModal';
import { MoveList } from '../features/game/MoveList';
import { PlayerBar } from '../features/game/PlayerBar';
import { capturedBy, materialBalance } from '../features/game/result';
import { TimeControlPicker } from '../features/game/TimeControlPicker';
import { toTimeControl } from '../features/game/timeControls';
import { useNow } from '../hooks/useNow';
import { useLocalSession } from '../stores/localSession';
import { type PassAndPlayView, useSettings } from '../stores/settings';

export function LocalGamePage() {
  const phase = useLocalSession((s) => s.phase);
  return phase === 'setup' ? <LocalSetup /> : <LocalGame />;
}

function LocalSetup() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const fen = params.get('fen') ?? undefined;
  const choice = useSettings((s) => s.timeControl);
  const view = useSettings((s) => s.passAndPlayView);
  const update = useSettings((s) => s.update);
  const start = useLocalSession((s) => s.start);
  const [error, setError] = useState(false);

  const onStart = () => {
    try {
      start(toTimeControl(choice), fen);
    } catch (err) {
      if (err instanceof FenError) setError(true);
      else throw err;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('modes.local')}</h1>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">{t('play.timeControl')}</h2>
        <TimeControlPicker value={choice} onChange={(timeControl) => update({ timeControl })} />
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('play.view')}</h2>
        <SegmentedControl<PassAndPlayView>
          label={t('play.view')}
          value={view}
          onChange={(passAndPlayView) => update({ passAndPlayView })}
          options={[
            { value: 'fixed', label: t('play.viewFixed') },
            { value: 'rotate', label: t('play.viewRotate') },
            { value: 'tabletop', label: t('play.viewTabletop') },
          ]}
        />
      </Card>
      {fen && <p className="text-sm text-muted">{t('play.customPosition')}</p>}
      {error && (
        <p role="alert" className="font-bold text-danger">
          {t('play.invalidFen')}
        </p>
      )}
      <Button size="lg" block onClick={onStart}>
        {t('play.start')}
      </Button>
    </div>
  );
}

function LocalGame() {
  const { t } = useTranslation();
  const s = useLocalSession();
  const { game, version, result, clock, viewPly, flipped, startFen } = s;
  const theme = boardTheme(useSettings((st) => st.boardTheme));
  const showCoordinates = useSettings((st) => st.showCoordinates);
  const view = useSettings((st) => st.passAndPlayView);
  const [dismissedVersion, setDismissedVersion] = useState<number | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);

  const running = !!clock?.running && !result;
  const now = useNow(running ? 100 : null);
  const tick = s.tick;
  useEffect(() => {
    if (running) tick();
  }, [now, running, tick]);

  const records = game.moves();
  const livePly = records.length;
  const shownPly = viewPly ?? livePly;
  const shown = useMemo(
    () => (shownPly === livePly ? game : new Game(shownPly === 0 ? startFen : records[shownPly - 1]!.fenAfter)),
    [game, shownPly, livePly, startFen, version], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const input = useMoveInput({ game, version, canMove: !result && viewPly === null, onMove: (m) => s.move(m) });

  const base: Color = view === 'rotate' ? game.turn : 'w';
  const orientation: Color = flipped ? (base === 'w' ? 'b' : 'w') : base;
  const top: Color = orientation === 'w' ? 'b' : 'w';
  const times = clock ? timesAt(clock, now) : null;
  const balance = materialBalance(shown);
  const last = shownPly > 0 ? records[shownPly - 1]! : null;
  const counting = shown.counting();

  const bar = (color: Color, rotated = false) => (
    <PlayerBar
      color={color}
      name={t(color === 'w' ? 'play.white' : 'play.black')}
      captured={capturedBy(records.slice(0, shownPly), color)}
      advantage={color === 'w' ? balance : -balance}
      timeMs={times ? times[color] : null}
      active={!result && game.turn === color}
      rotated={rotated}
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:flex-row lg:items-start">
      <h1 className="sr-only">{t('modes.local')}</h1>
      <div className="mx-auto flex w-full max-w-[min(100%,calc(100dvh-13rem),44rem)] flex-col gap-2">
        {bar(top, view === 'tabletop')}
        <Board
          pieces={shown.pieces()}
          theme={theme}
          orientation={orientation}
          showCoordinates={showCoordinates}
          lastMove={last ? { from: last.from, to: last.to } : null}
          checkSquare={shown.checkedKingSquare()}
          selected={input.selected}
          targets={input.targets}
          onSquareClick={input.onSquareClick}
          canDrag={input.canDrag}
          onDrop={input.onDrop}
        />
        {bar(orientation)}
      </div>

      <aside className="flex w-full flex-col gap-3 lg:w-80 lg:shrink-0">
        <Card
          role="status"
          data-testid="turn-banner"
          tone={result ? 'secondary' : game.inCheck() ? 'danger' : 'default'}
          className="py-3 text-center text-lg font-extrabold"
        >
          {result
            ? t(result.winner === 'w' ? 'play.result.whiteWins' : result.winner === 'b' ? 'play.result.blackWins' : 'play.result.draw')
            : t('play.turn', { color: t(`colors.${game.turn}`) }) + (game.inCheck() ? ` · ${t('play.check')}` : '')}
        </Card>
        {viewPly !== null && (
          <Button variant="secondary" onClick={() => s.setViewPly(null)}>
            {t('play.backToLive')}
          </Button>
        )}
        {counting && <CountingIndicator counting={counting} />}
        <GameControls
          canBack={shownPly > 0}
          canForward={shownPly < livePly}
          onFirst={() => s.setViewPly(0)}
          onBack={() => s.setViewPly(shownPly - 1)}
          onForward={() => s.setViewPly(shownPly + 1)}
          onLast={() => s.setViewPly(null)}
          onFlip={s.flip}
          onUndo={() => s.undo()}
          canUndo={livePly > 0 && (!result || ['checkmate', 'stalemate', 'repetition', 'counting', 'insufficient-material'].includes(result.reason))}
          onResign={() => setConfirmResign(true)}
          canResign={!result}
        />
        <MoveList records={records} currentPly={shownPly} onSelect={(ply) => s.setViewPly(ply)} />
        <Button variant="ghost" onClick={s.exitToSetup}>
          {t('play.newGame')}
        </Button>
      </aside>

      {result && (
        <GameOverModal
          result={result}
          open={dismissedVersion !== version}
          onClose={() => setDismissedVersion(version)}
          onRematch={() => s.start(s.timeControl, startFen)}
          onNewGame={s.exitToSetup}
        />
      )}
      <Modal
        open={confirmResign}
        onClose={() => setConfirmResign(false)}
        title={t('play.resignConfirm', { color: t(`colors.${game.turn}`) })}
      >
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmResign(false)}>
            {t('play.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmResign(false);
              s.resign(game.turn);
            }}
          >
            {t('play.resign')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
