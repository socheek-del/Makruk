import type { AccountResponse, AuthConfigResponse, GameSummary } from '@makruk/protocol';
import { LoaderCircle, LogOut, Mail, Trophy } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { Button, buttonClasses } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { fetchAccount, fetchAuthConfig, fetchHistory, requestMagicLink, testLogin } from '../features/online/api';
import { displayName, type Identity, setIdentity, signOut, useIdentity } from '../features/online/identity';
import { cn } from '../lib/cn';

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const { identity, failed } = useIdentity();
  const [config, setConfig] = useState<AuthConfigResponse | null>(null);
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [games, setGames] = useState<GameSummary[] | null>(null);

  useEffect(() => {
    fetchAuthConfig().then(setConfig).catch(() => setConfig({ google: false, email: false, testLogin: false }));
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
        <SignIn config={config} identity={identity} lang={i18n.language === 'en' ? 'en' : 'th'} />
      )}

      <History games={games} />
    </div>
  );
}

function SignIn({ config, identity, lang }: { config: AuthConfigResponse; identity: Identity; lang: 'th' | 'en' }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [testName, setTestName] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const sendLink = async (event: FormEvent) => {
    event.preventDefault();
    setError(false);
    try {
      await requestMagicLink({ email, guestToken: identity.token, lang });
      setSent(email);
    } catch {
      setError(true);
    }
  };

  const signInForTests = async (event: FormEvent) => {
    event.preventDefault();
    setError(false);
    try {
      setIdentity(await testLogin({ name: testName, email: testEmail, guestToken: identity.token }));
    } catch {
      setError(true);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-extrabold">{t('account.guestTitle')}</h2>
        <p className="text-muted">{t('account.guestHint')}</p>
      </div>
      {config.google && (
        <a
          href={`/api/auth/google/start?guest=${encodeURIComponent(identity.token)}`}
          className={buttonClasses({ variant: 'outline', size: 'lg', block: true })}
          data-testid="google-sign-in"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8h-4v3.1A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z" />
          </svg>
          {t('account.google')}
        </a>
      )}
      {config.email &&
        (sent ? (
          <p role="status" className="font-bold text-primary-shadow dark:text-primary">
            {t('account.linkSent', { email: sent })}
          </p>
        ) : (
          <form onSubmit={sendLink} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              aria-label={t('account.email')}
              placeholder={t('account.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1 rounded-2xl border-2 border-line bg-surface px-4 text-ink"
            />
            <Button type="submit" size="lg" variant="secondary">
              <Mail aria-hidden className="h-5 w-5" />
              {t('account.sendLink')}
            </Button>
          </form>
        ))}
      {!config.google && !config.email && <p className="text-sm text-muted">{t('account.signInUnavailable')}</p>}
      {config.testLogin && (
        <form onSubmit={signInForTests} data-testid="test-login" className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-warning p-3">
          <p className="text-sm font-extrabold text-warning-shadow dark:text-warning">{t('account.testLogin')}</p>
          <input
            aria-label={t('account.name')}
            placeholder={t('account.name')}
            required
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="h-11 rounded-xl border-2 border-line bg-surface px-3 text-ink"
          />
          <input
            type="email"
            aria-label={t('account.email')}
            placeholder={t('account.email')}
            required
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="h-11 rounded-xl border-2 border-line bg-surface px-3 text-ink"
          />
          <Button type="submit" variant="warning">
            {t('account.signIn')}
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="font-bold text-danger">
          {t('online.serverError')}
        </p>
      )}
    </Card>
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
