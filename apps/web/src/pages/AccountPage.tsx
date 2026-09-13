import type { AccountResponse, AuthConfigResponse, GameSummary } from '@makruk/protocol';
import { LoaderCircle, LogOut, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { fetchAccount, fetchAuthConfig, fetchHistory } from '../features/online/api';
import { AuthForms } from '../features/online/AuthForms';
import { displayName, type Identity, signOut, useIdentity } from '../features/online/identity';
import { cn } from '../lib/cn';

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const { identity, failed } = useIdentity();
  const [config, setConfig] = useState<AuthConfigResponse | null>(null);
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [games, setGames] = useState<GameSummary[] | null>(null);

  useEffect(() => {
    fetchAuthConfig().then(setConfig).catch(() => setConfig({ accounts: false, devOutbox: false }));
  }, []);

  const load = useCallback(async (id: Identity) => {
    setAccount(id.user.kind === 'user' ? await fetchAccount(id.token) : null);
    setGames(await fetchHistory(id.token));
  }, []);

  useEffect(() => {
    if (identity) void load(identity).catch(() => setGames([]));
  }, [identity, load]);

  if (failed) {
    return (
      <Card tone="danger" role="alert" className="mx-auto max-w-md font-bold text-danger">
        {t('online.serverError')}
      </Card>
    );
  }
  if (!identity || !config) {
    return <LoaderCircle aria-hidden className="mx-auto mt-16 h-8 w-8 animate-spin text-muted" />;
  }

  const signedIn = identity.user.kind === 'user';
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t('account.title')}</h1>
          <p data-testid="account-name" className="text-lg font-bold text-muted">
            {displayName(identity.user, t)}
          </p>
          {account?.email && <p className="text-sm text-muted">{account.email}</p>}
        </div>
        {signedIn && (
          <Button variant="outline" onClick={() => void signOut()}>
            <LogOut aria-hidden className="h-5 w-5" />
            {t('account.signOut')}
          </Button>
        )}
      </header>

      {signedIn ? (
        account && <Ratings account={account} />
      ) : (
        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-extrabold">{t('account.guestTitle')}</h2>
            <p className="text-muted">{t('account.guestHint')}</p>
          </div>
          {config.devOutbox && <p className="text-xs font-bold text-warning-shadow dark:text-warning">{t('account.devOutbox')}</p>}
          {config.accounts ? (
            <AuthForms identity={identity} lang={i18n.language === 'en' ? 'en' : 'th'} />
          ) : (
            <p className="text-sm text-muted">{t('account.signInUnavailable')}</p>
          )}
        </Card>
      )}

      <History games={games} />
    </div>
  );
}

function Ratings({ account }: { account: AccountResponse }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <Trophy aria-hidden className="h-5 w-5 text-gold" />
        {t('account.ratings')}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {account.ratings.map((r) => (
          <div key={r.timeClass} data-testid={`rating-${r.timeClass}`} data-rating={Math.round(r.rating)} className="rounded-2xl border-2 border-line p-3 text-center">
            <p className="text-sm font-extrabold text-muted">{t(`play.categories.${r.timeClass}`)}</p>
            <p className="text-3xl font-extrabold tabular-nums">
              {Math.round(r.rating)}
              {r.provisional && <span className="text-subtle">?</span>}
            </p>
            <p className="text-xs text-muted">{t('account.games', { count: r.games })}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function History({ games }: { games: GameSummary[] | null }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold">{t('account.history')}</h2>
      {games === null ? (
        <LoaderCircle aria-hidden className="h-6 w-6 animate-spin text-muted" />
      ) : games.length === 0 ? (
        <p className="text-muted">{t('account.noGames')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((game) => {
            const you = game.yourColor;
            const opponent = you === 'b' ? game.white : game.black;
            const outcome = game.result.winner === null ? 'draw' : game.result.winner === you ? 'win' : 'loss';
            return (
              <li key={game.id} data-testid="history-item" data-outcome={outcome}>
                <Link
                  to={`/replay/${encodeURIComponent(game.id)}`}
                  className="flex items-center gap-3 rounded-2xl border-2 border-line p-3 transition hover:bg-surface-2"
                >
                  <Badge tone={outcome === 'win' ? 'primary' : outcome === 'loss' ? 'danger' : 'neutral'}>{t(`account.${outcome}`)}</Badge>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-extrabold">{t('account.vs', { name: displayName(opponent, t) })}</span>
                    <span className="text-xs text-muted">
                      {t(`play.reason.${game.result.reason}`)} · {game.timeClass ? t(`play.categories.${game.timeClass}`) : t('play.noClock')} ·{' '}
                      {new Date(game.finishedAt).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <Badge tone={game.rated ? 'gold' : 'neutral'}>{t(game.rated ? 'account.rated' : 'account.casual')}</Badge>
                    {game.ratingChange !== null && (
                      <span
                        data-testid="rating-change"
                        className={cn('text-sm font-extrabold tabular-nums', game.ratingChange >= 0 ? 'text-primary' : 'text-danger')}
                      >
                        {game.ratingChange >= 0 ? '+' : ''}
                        {Math.round(game.ratingChange)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
