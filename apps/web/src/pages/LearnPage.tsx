import type { PieceType } from '@makruk/engine';
import { Check, Crown, Flame, Hash, Lock, type LucideIcon, Star, Swords, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Card } from '../components/ui/Card';
import { PieceSvg } from '../features/board/PieceSvg';
import { ALL_LESSONS, UNITS } from '../features/learn/lessons';
import { type Lesson, useL10n } from '../features/learn/types';
import { useNow } from '../hooks/useNow';
import { cn } from '../lib/cn';
import { currentStreak, useProgress } from '../stores/progress';

type Status = 'completed' | 'current' | 'unlocked' | 'locked';

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
  if (status === 'locked') return <Lock aria-hidden className="h-8 w-8" />;
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
  const streak = useProgress((s) => s.streak);
  const now = useNow(60_000);

  const firstOpen = ALL_LESSONS.find((l, i) => !lessons[l.id] && (i === 0 || lessons[ALL_LESSONS[i - 1]!.id]));
  const status = (lesson: Lesson): Status => {
    if (lessons[lesson.id]) return 'completed';
    if (lesson === firstOpen) return 'current';
    return 'locked';
  };

  let index = 0;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">{t('learn.title')}</h1>
        <div className="flex items-center gap-4 text-lg font-extrabold">
          <span className="flex items-center gap-1 text-gold" title={t('learn.streakLabel')}>
            <Flame aria-hidden className="h-6 w-6 fill-gold" />
            <span data-testid="streak" aria-label={t('learn.streakLabel')}>
              {currentStreak(streak, new Date(now))}
            </span>
          </span>
          <span className="flex items-center gap-1 text-secondary" title={t('learn.xpLabel')}>
            <Zap aria-hidden className="h-6 w-6 fill-secondary" />
            <span data-testid="xp">{xp} XP</span>
          </span>
        </div>
      </header>

      {UNITS.map((unit, u) => (
        <section key={unit.id} className="flex flex-col items-center gap-6">
          <Card className={cn('w-full border-b-4 text-white', UNIT_COLORS[u % UNIT_COLORS.length])}>
            <p className="text-sm font-extrabold uppercase opacity-80">{t('learn.unit', { number: u + 1 })}</p>
            <h2 className="text-xl font-extrabold">{tr(unit.title)}</h2>
          </Card>
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
                        state === 'locked' && 'border-line bg-surface-2 text-subtle',
                      )}
                    >
                      <LessonIcon lesson={lesson} status={state} />
                    </span>
                  </span>
                  <span className={cn('max-w-40 text-center text-sm font-extrabold', state === 'locked' && 'text-subtle')}>
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
                  {state === 'locked' ? (
                    <div aria-disabled title={t('learn.locked')}>
                      {node}
                    </div>
                  ) : (
                    <Link
                      to={lesson.route ?? `/learn/${lesson.id}`}
                      aria-label={tr(lesson.title)}
                      className="block rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40 active:translate-y-1"
                    >
                      {node}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
