import { MatchServerMessage, QuickPool } from '@makruk/protocol';
import { LoaderCircle, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { Identity } from './identity';

/** online-005: pick a pool, wait in the queue, jump into the game when paired. */
export function QuickMatch({ identity }: { identity: Identity | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searching, setSearching] = useState<QuickPool | null>(null);
  const [failed, setFailed] = useState(false);
  const socket = useRef<WebSocket | null>(null);

  const stop = () => {
    socket.current?.close(1000, 'cancel');
    socket.current = null;
    setSearching(null);
  };

  useEffect(() => () => socket.current?.close(1000, 'leave'), []);

  const start = (pool: QuickPool) => {
    if (!identity) return;
    stop();
    setFailed(false);
    const ws = new WebSocket(
      `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/match/${encodeURIComponent(pool)}?token=${encodeURIComponent(identity.token)}`,
    );
    socket.current = ws;
    setSearching(pool);
    ws.onmessage = (event) => {
      const parsed = MatchServerMessage.safeParse(JSON.parse(String(event.data)));
      if (!parsed.success) return;
      if (parsed.data.type === 'matched') {
        socket.current = null;
        navigate(`/play/online/${parsed.data.code}`);
      } else if (parsed.data.type === 'error') {
        setFailed(true);
        setSearching(null);
      }
    };
    ws.onclose = () => {
      if (socket.current === ws) {
        socket.current = null;
        setSearching(null);
      }
    };
  };

  return (
    <Card className="flex flex-col gap-3" data-testid="quick-match">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <Zap aria-hidden className="h-5 w-5 fill-gold text-gold" />
        {t('online.quickTitle')}
      </h2>
      {searching ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center" data-testid="searching">
          <p className="flex items-center gap-2 font-bold text-muted">
            <LoaderCircle aria-hidden className="h-5 w-5 animate-spin" />
            {t('online.searching', { pool: searching })}
          </p>
          <Button variant="outline" onClick={stop}>
            {t('play.cancel')}
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">{t('online.quickHint')}</p>
          <div className="grid grid-cols-3 gap-2">
            {QuickPool.options.map((pool) => (
              <Button key={pool} variant="secondary" size="lg" data-pool={pool} disabled={!identity} onClick={() => start(pool)}>
                {pool}
              </Button>
            ))}
          </div>
        </>
      )}
      {failed && (
        <p role="alert" className="font-bold text-danger">
          {t('online.serverError')}
        </p>
      )}
    </Card>
  );
}
