import { useMoveInput } from '@chaturanga/board-ui';
import { Game, parseSquare, squareName } from '@chaturanga/makruk';
import { Button, Card, cn, ProgressBar } from '@chaturanga/ui';
import { CheckCircle2, Star, X, XCircle } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { playSound } from '../sound/sound';
import { Board } from '../board/Board';
import { boardTheme } from '../board/themes';
import { Mascot, type MascotPose } from './Mascot';
import { type L10n, type Lesson, type LessonStep, useL10n } from './types';

type Feedback = null | 'correct' | 'wrong';

export function starsFor(mistakes: number): 1 | 2 | 3 {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}

export interface LessonPlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onFinish: (stars: 1 | 2 | 3) => void;
}

export function LessonPlayer({ lesson, onExit, onFinish }: LessonPlayerProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState(false);
  const step = lesson.steps[index]!;

  const answer = (correct: boolean) => {
    setFeedback(correct ? 'correct' : 'wrong');
    playSound(correct ? 'correct' : 'wrong');
    if (!correct) setMistakes((m) => m + 1);
  };
  const next = () => {
    setFeedback(null);
    if (index + 1 >= lesson.steps.length) setDone(true);
    else setIndex(index + 1);
  };
  const retry = () => {
    setFeedback(null);
    setAttempt((a) => a + 1);
  };

  if (done) return <LessonComplete lesson={lesson} stars={starsFor(mistakes)} onContinue={() => onFinish(starsFor(mistakes))} />;

  const completed = index + (feedback === 'correct' || step.kind === 'info' ? 1 : 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5" data-testid="lesson-player" data-step={index} data-step-kind={step.kind}>
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label={t('learn.exit')} onClick={onExit}>
          <X aria-hidden className="h-6 w-6 text-muted" />
        </Button>
        <ProgressBar value={completed / lesson.steps.length} label={t('learn.progress')} />
      </header>
      <StepView
        key={`${index}-${attempt}`}
        step={step}
        feedback={feedback}
        onAnswer={answer}
        onContinue={next}
        onRetry={retry}
      />
    </div>
  );
}

interface StepProps<S extends LessonStep> {
  step: S;
  feedback: Feedback;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onRetry: () => void;
}

function StepView(props: StepProps<LessonStep>) {
  switch (props.step.kind) {
    case 'info':
      return <InfoStep {...(props as StepProps<Extract<LessonStep, { kind: 'info' }>>)} />;
    case 'move':
      return <MoveStep {...(props as StepProps<Extract<LessonStep, { kind: 'move' }>>)} />;
    case 'squares':
      return <SquaresStep {...(props as StepProps<Extract<LessonStep, { kind: 'squares' }>>)} />;
    case 'quiz':
      return <QuizStep {...(props as StepProps<Extract<LessonStep, { kind: 'quiz' }>>)} />;
  }
}

function Prompt({ text, pose }: { text: L10n; pose: MascotPose }) {
  const tr = useL10n();
  return (
    <div className="flex items-end gap-3">
      <Mascot pose={pose} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
      <h1
        data-testid="lesson-prompt"
        className="relative flex-1 rounded-[1.25rem] border border-line bg-surface px-4 py-3 text-xl font-semibold leading-snug shadow-card sm:text-2xl"
      >
        {tr(text)}
      </h1>
    </div>
  );
}

/** art-002: the mascot reacts to the learner: explains, thinks along, cheers or commiserates. */
function poseFor(kind: LessonStep['kind'], feedback: Feedback): MascotPose {
  if (feedback === 'correct') return 'happy';
  if (feedback === 'wrong') return 'sad';
  return kind === 'info' ? 'idle' : 'thinking';
}

function LessonBoard({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-22rem),28rem)]">{children}</div>;
}

function Footer({
  feedback,
  onCheck,
  canCheck = true,
  onContinue,
  onRetry,
  hint,
  success,
}: {
  feedback: Feedback;
  onCheck?: () => void;
  canCheck?: boolean;
  onContinue: () => void;
  onRetry: () => void;
  hint?: L10n;
  success?: L10n;
}) {
  const { t } = useTranslation();
  const tr = useL10n();
  if (feedback === 'correct') {
    return (
      <Card tone="secondary" role="status" data-testid="feedback" data-result="correct" className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xl font-bold text-secondary-shadow dark:text-secondary">
          <CheckCircle2 aria-hidden className="h-6 w-6" />
          {t('learn.correct')}
        </p>
        {success && <p className="font-medium">{tr(success)}</p>}
        <Button block size="lg" variant="secondary" onClick={onContinue}>
          {t('learn.continue')}
        </Button>
      </Card>
    );
  }
  if (feedback === 'wrong') {
    return (
      <Card tone="danger" role="status" data-testid="feedback" data-result="wrong" className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xl font-bold text-danger">
          <XCircle aria-hidden className="h-6 w-6" />
          {t('learn.wrong')}
        </p>
        {hint && <p className="font-medium">{tr(hint)}</p>}
        <Button block size="lg" variant="danger" onClick={onRetry}>
          {t('learn.tryAgain')}
        </Button>
      </Card>
    );
  }
  return onCheck ? (
    <Button block size="lg" onClick={onCheck} disabled={!canCheck}>
      {t('learn.check')}
    </Button>
  ) : (
    <Button block size="lg" onClick={onContinue}>
      {t('learn.continue')}
    </Button>
  );
}

function useTheme() {
  return boardTheme(useSettings((s) => s.boardTheme));
}

function InfoStep({ step, onContinue, onRetry, feedback }: StepProps<Extract<LessonStep, { kind: 'info' }>>) {
  const theme = useTheme();
  const [game] = useState(() => (step.fen ? new Game(step.fen) : null));
  return (
    <>
      <Prompt text={step.text} pose={poseFor(step.kind, feedback)} />
      {game && (
        <LessonBoard>
          <Board pieces={game.pieces()} theme={theme} targets={(step.highlight ?? []).map(parseSquare)} />
        </LessonBoard>
      )}
      <Footer feedback={feedback} onContinue={onContinue} onRetry={onRetry} />
    </>
  );
}

function MoveStep({ step, feedback, onAnswer, onContinue, onRetry }: StepProps<Extract<LessonStep, { kind: 'move' }>>) {
  const theme = useTheme();
  const [game] = useState(() => new Game(step.fen));
  const [version, setVersion] = useState(0);
  const input = useMoveInput({
    game,
    version,
    canMove: feedback === null,
    onMove: (move) => {
      const record = game.move(move);
      setVersion((v) => v + 1);
      onAnswer(step.solutions.some((s) => s.slice(0, 4) === record.uci.slice(0, 4)));
    },
  });
  const last = game.lastMove();
  return (
    <>
      <Prompt text={step.text} pose={poseFor(step.kind, feedback)} />
      <LessonBoard>
        <Board
          pieces={game.pieces()}
          theme={theme}
          lastMove={last ? { from: last.from, to: last.to } : null}
          checkSquare={game.checkedKingSquare()}
          selected={input.selected}
          targets={input.targets}
          onSquareClick={input.onSquareClick}
          canDrag={input.canDrag}
          onDrop={input.onDrop}
        />
      </LessonBoard>
      {feedback !== null && (
        <Footer feedback={feedback} onContinue={onContinue} onRetry={onRetry} hint={step.hint} success={step.success} />
      )}
    </>
  );
}

function SquaresStep({ step, feedback, onAnswer, onContinue, onRetry }: StepProps<Extract<LessonStep, { kind: 'squares' }>>) {
  const theme = useTheme();
  const [game] = useState(() => new Game(step.fen));
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (square: number) => {
    if (feedback !== null) return;
    const name = squareName(square);
    setPicked((p) => (p.includes(name) ? p.filter((s) => s !== name) : [...p, name]));
  };
  const check = () => {
    const expected = [...step.answer].sort().join();
    onAnswer([...picked].sort().join() === expected);
  };
  return (
    <>
      <Prompt text={step.text} pose={poseFor(step.kind, feedback)} />
      <LessonBoard>
        <Board pieces={game.pieces()} theme={theme} targets={picked.map(parseSquare)} onSquareClick={toggle} />
      </LessonBoard>
      <Footer
        feedback={feedback}
        onCheck={check}
        canCheck={picked.length > 0}
        onContinue={onContinue}
        onRetry={onRetry}
        hint={step.hint}
      />
    </>
  );
}

function QuizStep({ step, feedback, onAnswer, onContinue, onRetry }: StepProps<Extract<LessonStep, { kind: 'quiz' }>>) {
  const tr = useL10n();
  const theme = useTheme();
  const [game] = useState(() => (step.fen ? new Game(step.fen) : null));
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <>
      <Prompt text={step.text} pose={poseFor(step.kind, feedback)} />
      {game && (
        <LessonBoard>
          <Board pieces={game.pieces()} theme={theme} />
        </LessonBoard>
      )}
      <div role="radiogroup" aria-label={tr(step.text)} className="flex flex-col gap-3">
        {step.choices.map((c, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={choice === i}
            data-choice={i}
            disabled={feedback !== null}
            onClick={() => setChoice(i)}
            className={cn(
              'rounded-2xl border px-4 py-3 text-left text-lg font-medium shadow-card transition-colors',
              choice === i ? 'border-primary bg-primary-soft text-primary ring-1 ring-primary' : 'border-line bg-surface hover:bg-surface-2',
            )}
          >
            {tr(c)}
          </button>
        ))}
      </div>
      <Footer
        feedback={feedback}
        onCheck={() => onAnswer(choice === step.correct)}
        canCheck={choice !== null}
        onContinue={onContinue}
        onRetry={onRetry}
        hint={step.hint}
      />
    </>
  );
}

function LessonComplete({ lesson, stars, onContinue }: { lesson: Lesson; stars: 1 | 2 | 3; onContinue: () => void }) {
  const { t } = useTranslation();
  const tr = useL10n();
  useEffect(() => playSound('gameEnd'), []);
  return (
    <div data-testid="lesson-complete" data-stars={stars} className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-8 text-center">
      <Mascot pose="celebrate" className="h-36 w-36" />
      <p className="text-lg font-bold text-muted">{tr(lesson.title)}</p>
      <h1 className="text-4xl font-extrabold text-gold">{t('learn.complete')}</h1>
      <div className="flex gap-2" role="img" aria-label={t('learn.stars', { count: stars })}>
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={cn('h-16 w-16 transition-transform', i <= stars ? 'scale-100 fill-gold text-gold' : 'scale-90 text-line')}
          />
        ))}
      </div>
      <Card tone="warning" className="px-6 text-2xl font-extrabold text-gold">
        +{lesson.xp} XP
      </Card>
      <Button size="lg" block onClick={onContinue}>
        {t('learn.continue')}
      </Button>
    </div>
  );
}
