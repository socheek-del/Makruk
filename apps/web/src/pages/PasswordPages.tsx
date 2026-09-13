import { Password } from '@makruk/protocol';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AuthRequestError, forgotPassword, resetPassword } from '../features/online/api';
import { Field, FormMessage } from '../features/online/AuthForms';
import { setIdentity } from '../features/online/identity';

/** acct-002: request a password-reset email. */
export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await forgotPassword({ email, lang: i18n.language === 'en' ? 'en' : 'th' });
      setSent(true);
    } catch (err) {
      setError(`account.errors.${err instanceof AuthRequestError ? err.code : 'server'}`);
    }
  };

  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('account.forgotTitle')}</h1>
      {sent ? (
        <FormMessage tone="success">{t('account.resetSent')}</FormMessage>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-muted">{t('account.forgotHint')}</p>
          <Field label={t('account.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <FormMessage tone="error">{t(error)}</FormMessage>}
          <Button type="submit" size="lg" block>
            {t('account.sendReset')}
          </Button>
        </form>
      )}
      <Link to="/account" className="text-center text-sm font-extrabold text-secondary">
        {t('account.title')}
      </Link>
    </Card>
  );
}

/** acct-002: choose a new password from the emailed link. */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!Password.safeParse(password).success) return setError('account.passwordHint');
    if (password !== confirm) return setError('account.passwordMismatch');
    try {
      setIdentity(await resetPassword({ token, password }));
      navigate('/account', { replace: true });
    } catch (err) {
      setError(`account.errors.${err instanceof AuthRequestError ? err.code : 'server'}`);
    }
  };

  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('account.resetTitle')}</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label={t('account.newPassword')} hint={t('account.passwordHint')} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPasswordValue(e.target.value)} />
        <Field label={t('account.confirmPassword')} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <FormMessage tone="error">{t(error)}</FormMessage>}
        <Button type="submit" size="lg" block>
          {t('account.savePassword')}
        </Button>
      </form>
    </Card>
  );
}
