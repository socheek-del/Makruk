import { Password, Username } from '@makruk/protocol';
import { type FormEvent, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { AuthRequestError, login, register, resendVerification } from './api';
import { type Identity, setIdentity } from './identity';

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm font-bold">
      {label}
      <input {...input} aria-label={label} className="h-12 rounded-2xl border-2 border-line bg-surface px-4 text-base font-normal text-ink" />
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={tone === 'error' ? 'font-bold text-danger' : 'font-bold text-primary-shadow dark:text-primary'}>
      {children}
    </p>
  );
}

const errorKey = (err: unknown) => `account.errors.${err instanceof AuthRequestError ? err.code : 'server'}`;

/** acct-002: sign in or create an account (username + password, confirmed by email). */
export function AuthForms({ identity, lang }: { identity: Identity; lang: 'th' | 'en' }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'signIn' | 'register'>('signIn');
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl<'signIn' | 'register'>
        label={t('account.title')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'signIn', label: t('account.tabSignIn') },
          { value: 'register', label: t('account.tabRegister') },
        ]}
      />
      {tab === 'signIn' ? <SignInForm identity={identity} lang={lang} /> : <RegisterForm identity={identity} lang={lang} />}
    </div>
  );
}

function SignInForm({ identity, lang }: { identity: Identity; lang: 'th' | 'en' }) {
  const { t } = useTranslation();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setUnverified(false);
    try {
      setIdentity(await login({ login: loginName, password, guestToken: identity.user.kind === 'guest' ? identity.token : undefined }));
    } catch (err) {
      setUnverified(err instanceof AuthRequestError && err.code === 'email_not_verified');
      setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} data-testid="sign-in-form" className="flex flex-col gap-3">
      <Field label={t('account.login')} autoComplete="username" required value={loginName} onChange={(e) => setLoginName(e.target.value)} />
      <Field label={t('account.password')} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <FormMessage tone="error">{t(error)}</FormMessage>}
      {unverified &&
        (resent ? (
          <FormMessage tone="success">{t('account.resent')}</FormMessage>
        ) : (
          <Button
            variant="outline"
            onClick={async () => {
              await resendVerification({ login: loginName, lang }).catch(() => {});
              setResent(true);
            }}
          >
            {t('account.resend')}
          </Button>
        ))}
      <Button type="submit" size="lg" block disabled={busy}>
        {t('account.signIn')}
      </Button>
      <Link to="/forgot-password" className="text-center text-sm font-extrabold text-secondary">
        {t('account.forgot')}
      </Link>
    </form>
  );
}

function RegisterForm({ identity, lang }: { identity: Identity; lang: 'th' | 'en' }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!Username.safeParse(username).success) return setError('account.usernameHint');
    if (!Password.safeParse(password).success) return setError('account.passwordHint');
    if (password !== confirm) return setError('account.passwordMismatch');
    setBusy(true);
    try {
      await register({ username, email, password, lang, guestToken: identity.user.kind === 'guest' ? identity.token : undefined });
      setSentTo(email);
    } catch (err) {
      setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <div data-testid="verification-sent" className="flex flex-col gap-2 rounded-2xl border-2 border-primary bg-primary-soft p-4">
        <FormMessage tone="success">{t('account.verificationSent', { email: sentTo })}</FormMessage>
      </div>
    );
  }

  return (
    <form onSubmit={submit} data-testid="register-form" className="flex flex-col gap-3">
      <Field label={t('account.username')} hint={t('account.usernameHint')} autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
      <Field label={t('account.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label={t('account.password')} hint={t('account.passwordHint')} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Field label={t('account.confirmPassword')} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <FormMessage tone="error">{t(error)}</FormMessage>}
      <Button type="submit" size="lg" block disabled={busy}>
        {t('account.createAccount')}
      </Button>
    </form>
  );
}
