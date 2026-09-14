import { RoomCode } from '@chaturanga/protocol';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Card, SegmentedControl } from '@chaturanga/ui';
import { TimeControlPicker } from '../features/game/TimeControlPicker';
import { toTimeControl } from '../features/game/timeControls';
import { createRoom, fetchRoom } from '../features/online/api';
import { useIdentity } from '../features/online/identity';
import { QuickMatch } from '../features/online/QuickMatch';
import { useSettings } from '../stores/settings';

export function OnlinePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { identity, failed } = useIdentity();
  const timeControl = useSettings((s) => s.onlineTimeControl);
  const color = useSettings((s) => s.onlineColor);
  const update = useSettings((s) => s.update);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<'invalid' | 'notFound' | null>(null);
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [serverError, setServerError] = useState(false);

  const create = async () => {
    if (!identity) return;
    setBusy('create');
    setServerError(false);
    try {
      const room = await createRoom(identity.token, { timeControl: toTimeControl(timeControl), color, rated: false });
      navigate(`/play/online/${room}`);
    } catch {
      setServerError(true);
    } finally {
      setBusy(null);
    }
  };

  const join = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!RoomCode.safeParse(normalized).success) return setJoinError('invalid');
    setBusy('join');
    setJoinError(null);
    try {
      const room = await fetchRoom(normalized);
      if (!room) setJoinError('notFound');
      else navigate(`/play/online/${normalized}`);
    } catch {
      setServerError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('modes.online')}</h1>

      {(failed || serverError) && (
        <Card tone="danger" role="alert" className="font-bold text-danger">
          {t('online.serverError')}
        </Card>
      )}

      <QuickMatch identity={identity} />

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">{t('online.createTitle')}</h2>
        <TimeControlPicker value={timeControl} onChange={(onlineTimeControl) => update({ onlineTimeControl })} />
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-muted">{t('online.color')}</h3>
          <SegmentedControl<'w' | 'b' | 'random'>
            label={t('online.color')}
            value={color}
            onChange={(onlineColor) => update({ onlineColor })}
            options={[
              { value: 'w', label: t('computer.sideWhite') },
              { value: 'b', label: t('computer.sideBlack') },
              { value: 'random', label: t('computer.sideRandom') },
            ]}
          />
        </div>
        <Button size="lg" block onClick={create} disabled={!identity || busy !== null}>
          {busy === 'create' && <LoaderCircle aria-hidden className="h-5 w-5 animate-spin" />}
          {t('online.create')}
        </Button>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('online.joinTitle')}</h2>
        <form onSubmit={join} className="flex flex-col gap-3 sm:flex-row">
          <input
            aria-label={t('online.codeLabel')}
            placeholder="ABC234"
            value={code}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setJoinError(null);
            }}
            className="h-12 flex-1 rounded-2xl border-2 border-line bg-surface px-4 text-center font-mono text-2xl font-extrabold uppercase tracking-[0.3em] text-ink"
          />
          <Button type="submit" size="lg" variant="secondary" disabled={!identity || busy !== null}>
            {t('online.join')}
          </Button>
        </form>
        {joinError && (
          <p role="alert" className="font-bold text-danger">
            {t(joinError === 'invalid' ? 'online.invalidCode' : 'online.notFound')}
          </p>
        )}
      </Card>
    </div>
  );
}
