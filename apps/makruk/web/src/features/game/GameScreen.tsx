import { type Color, Game } from '@chaturanga/makruk';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StoreApi, UseBoundStore } from 'zustand';
import { Button, Card, Modal } from '@chaturanga/ui';
import { useNow } from '../../hooks/useNow';
import type { GameSessionState } from '../../stores/localSession';
import { useSettings } from '../../stores/settings';
import { playSound, soundForMove } from '../sound/sound';
import { useMoveInput } from '@chaturanga/board-ui';
import { Board } from '../board/Board';
import { boardTheme } from '../board/themes';
import { timesAt } from './clock';
import { CountingIndicator } from './CountingIndicator';
import { GameControls } from './GameControls';
import { GameOverModal, resultTitleKey } from './GameOverModal';
import { MoveList } from './MoveList';
import { PlayerBar } from './PlayerBar';
import { capturedBy, materialBalance } from './result';

export interface GameScreenProps {
  useSession: UseBoundStore<StoreApi<GameSessionState>>;
  title: string;
  orientation: Color;
  names: Record<Color, string>;
  /** Extra gate on move input (e.g. only on the human's turn). */
  inputEnabled: boolean;
  rotateTopBar?: boolean;
  canUndo: boolean;
  onUndo: () => void;
  /** Which side the resign button resigns for. */
  resignColor: Color;
  hint?: { from: number; to: number } | null;
  /** Extra status line under the turn banner (e.g. "thinking…"). */
  status?: ReactNode;
  /** Extra action buttons (e.g. hint). */
  actions?: ReactNode;
  onRematch: () => void;
  /** Replays show the result in the banner only. */
  showResultDialog?: boolean;
}

export function GameScreen({
  useSession,
  title,
  orientation,
  names,
  inputEnabled,
  rotateTopBar,
  canUndo,
  onUndo,
  resignColor,
  hint,
  status,
  actions,
  onRematch,
  showResultDialog = true,
}: GameScreenProps) {
  const { t } = useTranslation();
  const s = useSession();
  const { game, version, result, clock, viewPly, startFen } = s;
  const theme = boardTheme(useSettings((st) => st.boardTheme));
  const showCoordinates = useSettings((st) => st.showCoordinates);
  const [dismissedVersion, setDismissedVersion] = useState<number | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);

  // The Start button sits low on setup screens; open the game at the top so both player bars show.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // polish-003: one sound per new move (not on snapshots, undo or history browsing), and one when the game ends.
  const heard = useRef({ plies: game.moves().length, over: !!result });
  useEffect(() => {
    const plies = game.moves().length;
    const last = game.lastMove();
    if (plies > heard.current.plies && last) playSound(soundForMove(last, game.status()));
    else if (result && !heard.current.over) playSound('gameEnd');
    heard.current = { plies, over: !!result };
  }, [version, game, result]);

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

  const input = useMoveInput({
    game,
    version,
    canMove: inputEnabled && !result && viewPly === null,
    onMove: (m) => s.move(m),
  });

  const top: Color = orientation === 'w' ? 'b' : 'w';
  const times = clock ? timesAt(clock, now) : null;
  const balance = materialBalance(shown);
  const last = shownPly > 0 ? records[shownPly - 1]! : null;
  const counting = shown.counting();

  const bar = (color: Color, rotated = false) => (
    <PlayerBar
      color={color}
      name={names[color]}
      captured={capturedBy(records.slice(0, shownPly), color)}
      advantage={color === 'w' ? balance : -balance}
      timeMs={times ? times[color] : null}
      active={!result && game.turn === color}
      rotated={rotated}
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:flex-row lg:items-start">
      <h1 className="sr-only">{title}</h1>
      <div className="mx-auto flex w-full max-w-[min(100%,calc(100dvh-13rem),44rem)] flex-col gap-2">
        {bar(top, rotateTopBar)}
        <Board
          pieces={shown.pieces()}
          theme={theme}
          orientation={orientation}
          showCoordinates={showCoordinates}
          lastMove={last ? { from: last.from, to: last.to } : null}
          checkSquare={shown.checkedKingSquare()}
          hint={viewPly === null ? hint : null}
          animate={viewPly === null && last ? { from: last.from, to: last.to, key: `${livePly}` } : null}
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
            ? t(resultTitleKey(result))
            : t('play.turn', { color: t(`colors.${game.turn}`) }) + (game.inCheck() ? ` · ${t('play.check')}` : '')}
        </Card>
        {status}
        {viewPly !== null && (
          <Button variant="secondary" onClick={() => s.setViewPly(null)}>
            {t('play.backToLive')}
          </Button>
        )}
        {counting && <CountingIndicator counting={counting} />}
        {actions}
        <GameControls
          canBack={shownPly > 0}
          canForward={shownPly < livePly}
          onFirst={() => s.setViewPly(0)}
          onBack={() => s.setViewPly(shownPly - 1)}
          onForward={() => s.setViewPly(shownPly + 1)}
          onLast={() => s.setViewPly(null)}
          onFlip={s.flip}
          onUndo={onUndo}
          canUndo={canUndo}
          onResign={() => setConfirmResign(true)}
          canResign={!result}
        />
        <MoveList records={records} currentPly={shownPly} onSelect={(ply) => s.setViewPly(ply)} />
        <Button variant="ghost" onClick={s.exitToSetup}>
          {t('play.newGame')}
        </Button>
      </aside>

      {result && showResultDialog && (
        <GameOverModal
          result={result}
          open={dismissedVersion !== version}
          onClose={() => setDismissedVersion(version)}
          onRematch={onRematch}
          onNewGame={s.exitToSetup}
        />
      )}
      <Modal
        open={confirmResign}
        onClose={() => setConfirmResign(false)}
        title={t('play.resignConfirm', { color: t(`colors.${resignColor}`) })}
      >
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmResign(false)}>
            {t('play.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmResign(false);
              s.resign(resignColor);
            }}
          >
            {t('play.resign')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** Undo is allowed unless the game ended by time, resignation, agreement or abandonment. */
export function undoAllowed(session: Pick<GameSessionState, 'game' | 'result'>): boolean {
  const { game, result } = session;
  return game.moves().length > 0 && (!result || ['checkmate', 'stalemate', 'repetition', 'counting', 'insufficient-material'].includes(result.reason));
}
