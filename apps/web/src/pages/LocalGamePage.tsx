import { useTranslation } from 'react-i18next';
import { Board } from '../features/board/Board';
import { boardTheme } from '../features/board/themes';
import { useSettings } from '../stores/settings';
import { useLocalGame } from '../stores/game';

export function LocalGamePage() {
  const { t } = useTranslation();
  const game = useLocalGame((s) => s.game);
  useLocalGame((s) => s.version);
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const last = game.lastMove();

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="self-start text-2xl font-extrabold">{t('modes.local')}</h1>
      <div className="w-full max-w-[min(100%,calc(100dvh-14rem),40rem)]" data-testid="board-container">
        <Board
          pieces={game.pieces()}
          theme={theme}
          showCoordinates={showCoordinates}
          lastMove={last ? { from: last.from, to: last.to } : null}
          checkSquare={game.checkedKingSquare()}
        />
      </div>
    </div>
  );
}
