import { inSetupPhase } from '@chaturanga/game-shell';
import { OnlineRoom, type OnlineRoomContext, type OnlineScreenProps } from '@chaturanga/game-shell/ui';
import { type Game, sittuyin } from '@chaturanga/sittuyin';
import { Button } from '@chaturanga/ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { autoArrange } from '../features/game/autoArrange';
import { GameScreen } from '../features/game/GameScreen';
import { identity } from '../features/online/identity';

const roomPath = (code: string) => `/play/online/${code}`;

/** One room per code, so a rematch starts with a fresh connection and session. */
export function OnlineGameRoute() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const onLeave = useCallback(() => navigate('/play/online'), [navigate]);
  const onEnterRoom = useCallback((next: string) => navigate(roomPath(next)), [navigate]);
  const upper = code.toUpperCase();

  return (
    <OnlineRoom
      key={upper}
      code={upper}
      variant={sittuyin}
      identity={identity}
      roomUrl={(room) => `${location.origin}${roomPath(room)}`}
      onEnterRoom={onEnterRoom}
      onLeave={onLeave}
      renderGame={(screen, context) => <OnlineGame screen={screen} {...context} />}
    />
  );
}

/**
 * The online Sittuyin game: the shared online screen plus Auto-arrange for your own pieces. Setup
 * alternates, so Auto-arrange places your next piece each time the turn comes back to you, until your
 * hand is empty; the opponent places theirs however they like.
 */
function OnlineGame({ screen, session, you }: { screen: OnlineScreenProps<Game> } & OnlineRoomContext<Game>) {
  const { t } = useTranslation();
  const game = session((s) => s.game);
  const version = session((s) => s.version);
  const result = session((s) => s.result);
  const [arranging, setArranging] = useState(false);
  const placing = inSetupPhase(game);

  useEffect(() => {
    if (!arranging || !you) return;
    if (!inSetupPhase(game) || game.hand(you).length === 0) return setArranging(false);
    if (game.turn !== you || result) return;
    autoArrange(game, (uci) => session.getState().move(uci), (color) => color === you);
  }, [arranging, version, result, you]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GameScreen
      {...screen}
      actions={
        <>
          {placing && you && !result && (
            <Button variant="secondary" data-testid="auto-arrange" disabled={arranging} onClick={() => setArranging(true)}>
              {t('setup.autoArrange')}
            </Button>
          )}
          {screen.actions}
        </>
      }
    />
  );
}
