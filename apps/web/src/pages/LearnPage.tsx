import type { PieceType } from '@makruk/engine';
import { Check, Crown, Hash, type LucideIcon, Star, Swords, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PieceSvg } from '../features/board/PieceSvg';
import { ALL_LESSONS, UNITS } from '../features/learn/lessons';
import { type Lesson, useL10n } from '../features/learn/types';
import { cn } from '../lib/cn';
import { useProgress } from '../stores/progress';

/** Every lesson is open; `current` just marks the first one not yet completed. */
type Status = 'completed' | 'current' | 'unlocked';

/** Horizontal offsets (rem) that give the path its Duolingo-style zig-zag. */
const ZIGZAG = [0, 3, 4.5, 3, 0, -3, -4.5, -3];

const UNIT_COLORS = ['bg-primary border-primary-shadow', 'bg-secondary border-secondary-shadow', 'bg-gold border-gold-shadow'];

const ICONS: Partial<Record<Lesson['icon'], LucideIcon>> = {
  board: Hash,
  check: Swords,
  mate: Crown,
  count: Hash,
  game: Swords,
  promotion: Star,
};

function LessonIcon({ lesson, status }: { lesson: Lesson; status: Status }) {
  if (status === 'completed') return <Check aria-hidden className="h-9 w-9" strokeWidth={3} />;
  if (lesson.icon.length === 1) {
    return <PieceSvg piece={{ color: 'w', type: lesson.icon as PieceType, promoted: false }} className="h-11 w-11" />;
  }
  const Icon = ICONS[lesson.icon] ?? Star;
  return <Icon aria-hidden className="h-8 w-8" strokeWidth={2.5} />;
}

export function LearnPage() {
  const { t } = useTranslation();
  const tr = useL10n();
  const lessons = useProgress((s) => s.lessons);
  const xp = useProgress((s) => s.xp);

  const firstOpen = ALL_LESSONS.find((l) => !lessons[l.id]);
  const status = (lesson: Lesson): Status => {
    if (lessons[lesson.id]) return 'completed';
    return lesson === firstOpen ? 'current' : 'unlocked';
  };

  let index = 0;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">{t('learn.title')}</h1>
        <div className="flex items-center gap-4 text-lg font-extrabold">
          <span className="flex items-center gap-1 text-secondary" title={t('learn.xpLabel')}>
            <Zap aria-hidden className="h-6 w-6 fill-secondary" />
            <span data-testid="xp">{xp} XP</span>
          </span>
        </div>
      </header>

      {UNITS.map((unit, u) => (
        <section key={unit.id} className="flex flex-col items-center gap-6">
          {/* A plain div: Card's surface background would override the unit colour and hide the white text. */}
          <div data-testid="unit-banner" className={cn('w-full rounded-2xl border-2 border-b-4 p-4 text-white', UNIT_COLORS[u % UNIT_COLORS.length])}>
            <p className="text-sm font-extrabold uppercase opacity-80">{t('learn.unit', { number: u + 1 })}</p>
            <h2 className="text-xl font-extrabold">{tr(unit.title)}</h2>
          </div>
          <ol className="flex w-full flex-col items-center gap-5">
            {unit.lessons.map((lesson) => {
              const state = status(lesson);
              const stars = lessons[lesson.id]?.stars ?? 0;
              const offset = ZIGZAG[index++ % ZIGZAG.length]!;
              const node = (
                <span className="flex flex-col items-center gap-1.5">
                  <span className="relative">
                    {state === 'current' && (
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-xl border-2 border-line bg-surface px-3 py-1 text-sm font-extrabold text-primary">
                        {t('learn.start')}
                      </span>
                    )}
                    <span
                      className={cn(
                        'grid h-20 w-20 place-items-center rounded-full border-b-[6px] text-white transition-transform',
                        state === 'completed' && 'border-gold-shadow bg-gold',
                        state === 'current' && 'border-primary-shadow bg-primary ring-8 ring-primary/20',
                        state === 'unlocked' && 'border-secondary-shadow bg-secondary',
                      )}
                    >
                      <LessonIcon lesson={lesson} status={state} />
                    </span>
                  </span>
                  <span className="max-w-40 text-center text-sm font-extrabold">
                    {tr(lesson.title)}
                  </span>
                  {stars > 0 && (
                    <span className="flex" aria-label={t('learn.stars', { count: stars })}>
                      {[1, 2, 3].map((i) => (
                        <Star key={i} aria-hidden className={cn('h-4 w-4', i <= stars ? 'fill-gold text-gold' : 'text-line')} />
                      ))}
                    </span>
                  )}
                </span>
              );
              return (
                <li
                  key={lesson.id}
                  data-lesson={lesson.id}
                  data-status={state === 'current' ? 'unlocked' : state}
                  style={{ transform: `translateX(${offset}rem)` }}
                >
                  <Link
                    to={lesson.route ?? `/learn/${lesson.id}`}
                    aria-label={tr(lesson.title)}
                    className="block rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40 active:translate-y-1"
                  >
                    {node}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
