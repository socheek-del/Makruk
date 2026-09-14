import { buttonClasses, Card } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';

const REPO = 'https://github.com/socheek-del/chaturanga';

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('nav.about')}</h1>
      <Card className="flex flex-col gap-3">
        <p>{t('about.what')}</p>
        <p className="text-muted">{t('about.free')}</p>
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('about.openSource')}</h2>
        <p className="text-muted">{t('about.licence')}</p>
        <a className={buttonClasses({ variant: 'outline' })} href={REPO} target="_blank" rel="noreferrer">
          {t('about.source')}
        </a>
      </Card>
    </div>
  );
}
