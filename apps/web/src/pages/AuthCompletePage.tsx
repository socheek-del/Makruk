import { PublicUser } from '@makruk/protocol';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { buttonClasses } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { setIdentity } from '../features/online/identity';

/** Landing page after magic-link or Google sign-in: the token arrives in the URL fragment. */
export function AuthCompletePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get('token');
    history.replaceState(null, '', location.pathname);
    if (!token) {
      setFailed(true);
      return;
    }
    fetch('/api/me', { headers: { authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const user = PublicUser.safeParse(res.ok ? await res.json() : null);
        if (!user.success) throw new Error('invalid token');
        setIdentity({ token, user: user.data });
        navigate('/account', { replace: true });
      })
      .catch(() => setFailed(true));
  }, [navigate]);

  if (!failed) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-lg font-bold text-muted">
        <LoaderCircle aria-hidden className="h-6 w-6 animate-spin" />
        {t('account.completing')}
      </p>
    );
  }
  return (
    <Card tone="danger" role="alert" className="mx-auto flex max-w-md flex-col gap-4 text-center">
      <p className="font-extrabold text-danger">{t('account.authError')}</p>
      <Link to="/account" className={buttonClasses({ variant: 'danger' })}>
        {t('account.title')}
      </Link>
    </Card>
  );
}
