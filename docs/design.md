# Design system

Two moods, one system:

- **App shell and learning = Duolingo-style.** Bright, friendly, chunky. Rounded
  shapes, bold type, pressable buttons, celebration moments.
- **Game screen = Chess.com-style.** Calm and focused. The board is the hero; chrome
  is compact and quiet.

Live showcase: `/design` (light and dark side by side).

## Tokens

Defined as CSS custom properties in `apps/web/src/index.css` and exposed to Tailwind
as colour utilities (`bg-primary`, `text-muted`, `border-line`, …). Light values sit on
`:root` / `[data-theme='light']`; dark values on `[data-theme='dark']`, which can be set
on `<html>` or any subtree (the showcase uses both at once).

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | #ffffff | #131f24 | Page background |
| `surface-2` | #f7f7f7 | #202f36 | Raised / hover areas |
| `line` | #e5e5e5 | #37464f | Borders, dividers, empty progress |
| `ink` | #3c3c3c | #f1f7fb | Body text |
| `muted` | #777777 | #8b9ca5 | Secondary text |
| `primary` (+`-shadow`, `-soft`) | #58cc02 | #93d333 | Main actions, success, progress |
| `secondary` | #1cb0f6 | #49c0f8 | Links, selection, info |
| `danger` | #ff4b4b | #ff4b4b | Errors, wrong answers, resign |
| `warning` | #ffc800 | #ffc800 | Hints, counting-rule alerts |
| `gold` | #ff9600 | #ff9600 | XP, stars, rewards |

Every accent has a darker `-shadow` shade for the pressable bottom border and a
`-soft` tint for tinted cards.

**Type:** Nunito (Latin) with Mitr (Thai), self-hosted via Fontsource so the PWA
works offline. Headings `font-extrabold`; body regular. Thai is the default language,
so layouts must allow Thai strings that run ~20% longer than English.

**Shape:** radius `rounded-2xl` (16px) for controls and cards, `rounded-3xl` for
dialogs and panels. Borders are 2px; pressable elements add a 4px bottom border.

**Motion:** short (75–150ms) press feedback; progress fills ease out over 500ms.
`prefers-reduced-motion` disables animation globally.

## Components (`apps/web/src/components/ui`)

| Component | Notes |
|---|---|
| `Button` / `buttonClasses()` | Variants: primary, secondary, outline, danger, warning, ghost. Sizes: sm, md, lg, icon. `block` for full width. `buttonClasses` styles links. |
| `Card` | `interactive` adds the pressable border; `tone` tints for correct/incorrect feedback. |
| `ProgressBar` | `role="progressbar"`, 0..1 value, primary/gold/secondary fills with a highlight stripe. |
| `Switch` | `role="switch"`, 56×32 touch target. |
| `SegmentedControl` | `role="radiogroup"` for small option sets (difficulty, theme, language). |
| `Badge` | Status and reward pills. |
| `Modal` | Native `<dialog>`: focus trap, Escape and backdrop click close. |
| `AppShell` | Bottom tab bar on phones, left rail from `md` (768px). |

Accessibility rules: every control has an accessible name; minimum touch target
40px; focus rings use `ring-secondary/40`; colour is never the only signal.

## Illustration and piece-art style guide

All art is made in-house as optimized SVG.

- **Mascot:** a friendly little Khun (ขุน) with a round body, big eyes and a small
  crown, drawn with thick 3px rounded strokes and flat fills from the accent palette.
  Poses: idle, happy, thinking, sad, celebrate.
- **Illustrations:** flat shapes, no gradients except a single soft highlight, 2–3
  accent colours per scene, generous white space, Thai motifs (temple roof lines,
  lotus, teak wood grain) used sparingly as accents.
- **Pieces:** silhouettes must read at 36px. White pieces use a light fill with a dark
  outline; black pieces a dark fill with a light inner highlight. Each type keeps its
  traditional Makruk shape (tall crowned Khun, rounded Met, pointed Khon, horse-head
  Ma, boat-hull Ruea, flat cowrie-shell Bia). Promoted Bia shows a Bia with a small
  Met marker.
- **Boards:** Makruk boards are un-checkered — a single colour with grid lines.
  Themes vary wood/material colour and line colour only.
