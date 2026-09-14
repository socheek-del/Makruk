import { cn } from '@chaturanga/ui';

export type MascotPose = 'idle' | 'happy' | 'thinking' | 'sad' | 'celebrate';

/**
 * art-002: "ขุนน้อย" (Little Khun), the in-house mascot — a round ivory Khun with a temple-gold crown and a
 * jade sash. Thick 3px rounded outlines and flat fills from the "Wat" palette (apps/makruk/docs/design.md).
 */
const INK = '#2a2230';
const IVORY = '#fdf3e1';
const SHADE = '#e6cfa6';
const GOLD = '#e0a93b';
const JADE = '#17866b';
const INDIGO = '#3a3f9b';
const LACQUER = '#b63a2b';
const BLUSH = '#f4a896';

function Eyes({ pose }: { pose: MascotPose }) {
  if (pose === 'happy' || pose === 'celebrate') {
    return <path d="M45 58 Q50 52 55 58 M65 58 Q70 52 75 58" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  }
  if (pose === 'sad') {
    return (
      <>
        {/* Inner brow ends raised: worried, not angry. */}
        <path d="M44 58 L54 54 M76 58 L66 54" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="62" r="3.5" fill={INK} />
        <circle cx="70" cy="62" r="3.5" fill={INK} />
      </>
    );
  }
  const look = pose === 'thinking' ? { dx: 2, dy: -3 } : { dx: 0, dy: 0 };
  return (
    <>
      <ellipse cx="50" cy="60" rx="5" ry="6" fill={INK} />
      <ellipse cx="70" cy="60" rx="5" ry="6" fill={INK} />
      <circle cx={51.5 + look.dx} cy={57.5 + look.dy} r="1.8" fill="#fff" />
      <circle cx={71.5 + look.dx} cy={57.5 + look.dy} r="1.8" fill="#fff" />
    </>
  );
}

function Mouth({ pose }: { pose: MascotPose }) {
  switch (pose) {
    case 'happy':
      return <path d="M52 71 Q60 80 68 71" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case 'celebrate':
      return <path d="M51 69 Q60 84 69 69 Z" fill={INK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />;
    case 'sad':
      return <path d="M53 76 Q60 70 67 76" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case 'thinking':
      return <path d="M55 74 H66" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
    default:
      return <path d="M54 72 Q60 76 66 72" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  }
}

function Arms({ pose }: { pose: MascotPose }) {
  const stroke = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: IVORY };
  switch (pose) {
    case 'celebrate':
      return (
        <>
          <path d="M31 70 L18 50 Q15 45 20 43 Q24 42 26 47 L37 64" {...stroke} />
          <path d="M89 70 L102 50 Q105 45 100 43 Q96 42 94 47 L83 64" {...stroke} />
        </>
      );
    case 'happy':
      return (
        <>
          <path d="M32 74 L22 62 Q19 58 23 56 Q27 55 29 59 L37 69" {...stroke} />
          <path d="M88 74 L98 62 Q101 58 97 56 Q93 55 91 59 L83 69" {...stroke} />
        </>
      );
    case 'thinking':
      return (
        <>
          <path d="M32 82 Q24 86 26 92 Q29 96 35 90" {...stroke} />
          <path d="M86 80 Q80 74 74 78 Q70 81 72 84" {...stroke} />
        </>
      );
    default:
      return (
        <>
          <path d="M31 80 Q22 88 26 94 Q30 97 36 90" {...stroke} />
          <path d="M89 80 Q98 88 94 94 Q90 97 84 90" {...stroke} />
        </>
      );
  }
}

export function Mascot({ pose = 'idle', className, title }: { pose?: MascotPose; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('overflow-visible', pose === 'celebrate' && 'animate-bounce', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-testid="mascot"
      data-pose={pose}
    >
      {pose === 'celebrate' && (
        <g>
          <path d="M14 22 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1 z" fill={GOLD} />
          <path d="M100 14 l2.5 5 5 .8 -3.8 3.5 .9 5 -4.6 -2.4 -4.4 2.4 .9 -5 -3.8 -3.5 5 -.8 z" fill={INDIGO} />
          <rect x="102.5" y="38.5" width="7" height="7" rx="1.5" transform="rotate(45 106 42)" fill={LACQUER} />
          <circle cx="10" cy="48" r="3" fill={JADE} />
        </g>
      )}
      {pose === 'thinking' && (
        <g fill={SHADE} stroke={INK} strokeWidth="2">
          <circle cx="94" cy="30" r="4" />
          <circle cx="104" cy="18" r="6" />
        </g>
      )}
      {pose === 'sad' && <path d="M84 44 Q88 52 84 56 Q80 52 84 44 Z" fill="#8fb3e6" stroke={INK} strokeWidth="2" />}

      {/* crown */}
      <path d="M42 38 L38 18 L50 26 L60 10 L70 26 L82 18 L78 38 Z" fill={GOLD} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="8" r="4" fill={GOLD} stroke={INK} strokeWidth="2.5" />
      {/* body */}
      <path d="M60 36 C84 36 94 56 94 76 C94 98 80 108 60 108 C40 108 26 98 26 76 C26 56 36 36 60 36 Z" fill={IVORY} stroke={INK} strokeWidth="3" />
      <path d="M36 84 C38 96 48 102 60 102" stroke={SHADE} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* sash */}
      <path d="M30 88 Q60 98 90 88 L91 95 Q60 106 29 95 Z" fill={JADE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <Arms pose={pose} />
      <Eyes pose={pose} />
      <circle cx="42" cy="70" r="4" fill={BLUSH} opacity="0.8" />
      <circle cx="78" cy="70" r="4" fill={BLUSH} opacity="0.8" />
      <Mouth pose={pose} />
    </svg>
  );
}
