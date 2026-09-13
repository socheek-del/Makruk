import type { GameRecordResponse } from '@makruk/protocol';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { GameScreen } from '../features/game/GameScreen';
import { fetchGameRecord } from '../features/online/api';
import { displayName, ensureIdentity } from '../features/online/identity';
import { createGameSession } from '../stores/localSession';

/** acct-003: replay a finished online game from history. */
export function ReplayPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GameRecordResponse | null | undefined>(undefined);
  const [session] = useState(() => createGameSession());

  useEffect(() => {
    let active = true;
    ensureIdentity()
      .then((identity) => fetchGameRecord(id, identity.token))
      .catch(() => fetchGameRecord(id))
      .then((found) => {
        if (!active) return;
        if (found) {
          const s = session.getState();
          s.start(null, found.startFen);
          for (const move of found.moves) s.move(move);
          session.setState({ result: found.result, exitToSetup: () => navigate('/account') });
        }
        setRecord(found);
      })
      .catch(() => active && setRecord(null));
    return () => {
      active = false;
    };
  }, [id, session, navigate]);

  if (record === undefined) return <LoaderCircle aria-hidden className="mx-auto mt-16 h-8 w-8 animate-spin text-muted" />;
  if (record === null) {
    return (
      <Card tone="danger" role="alert" className="mx-auto max-w-md font-bold text-danger">
        {t('account.notFound')}
      </Card>
    );
  }

  return (
    <GameScreen
      useSession={session}
      title={t('account.replay')}
      orientation={record.yourColor ?? 'w'}
      names={{ w: displayName(record.white, t), b: displayName(record.black, t) }}
      inputEnabled={false}
      canUndo={false}
      onUndo={() => {}}
      resignColor={record.yourColor ?? 'w'}
      showResultDialog={false}
      status={
        <Card data-testid="replay-info" className="flex flex-wrap items-center justify-center gap-2 py-2 text-sm font-bold">
          <Badge tone={record.rated ? 'gold' : 'neutral'}>{t(record.rated ? 'account.rated' : 'account.casual')}</Badge>
          {t(`play.reason.${record.result.reason}`)}
        </Card>
      }
      onRematch={() => navigate('/play/online')}
    />
  );
}
