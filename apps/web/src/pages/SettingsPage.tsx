import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { type Language, useSettings } from '../stores/settings';

export function SettingsPage() {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const update = useSettings((s) => s.update);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t('settings.title')}</h1>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('settings.language')}</h2>
        <SegmentedControl<Language>
          label={t('settings.language')}
          value={language}
          onChange={(value) => update({ language: value })}
          options={[
            { value: 'th', label: t('settings.languageTh') },
            { value: 'en', label: t('settings.languageEn') },
          ]}
        />
      </Card>
    </div>
  );
}
