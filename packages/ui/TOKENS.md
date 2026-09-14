# @chaturanga/ui tokens

These primitives carry shape, spacing, state and accessibility. They carry no palette. Every colour
they use is a Tailwind theme token that the product defines, so each game keeps its own design
identity on the same components (root `AGENTS.md`, "Design").

A product must therefore do two things in its own `index.css`:

1. Let Tailwind scan this package, next to the other shared packages:

   ```css
   @source '../../../../packages/ui/src';
   ```

2. Map every token below inside `@theme inline`, and define the `dark` variant.

## Colour tokens

| Token | Used by |
| --- | --- |
| `--color-surface` | Card, Modal, Button `outline`, SegmentedControl active segment |
| `--color-surface-2` | Badge `neutral`, ProgressBar track, Switch off, SegmentedControl track, hover states |
| `--color-line` | Card, Modal, Switch off, SegmentedControl borders |
| `--color-ink` | Modal text, SegmentedControl hover |
| `--color-muted` | Badge `neutral`, SegmentedControl inactive segment |
| `--color-primary` | Button, Badge, Card, ProgressBar, Switch on, all focus rings |
| `--color-primary-shadow` | Badge `primary` text in light mode |
| `--color-primary-soft` | Badge `primary`, Card `primary` |
| `--color-secondary` | Button, Badge, Card, ProgressBar |
| `--color-secondary-soft` | Badge `secondary`, Card `secondary` |
| `--color-danger` | Button, Badge, Card |
| `--color-danger-soft` | Badge `danger`, Card `danger` |
| `--color-warning` | Button, Badge, Card |
| `--color-warning-shadow` | Badge `warning` text in light mode |
| `--color-warning-soft` | Badge `warning`, Card `warning` |
| `--color-gold` | Badge `gold`, ProgressBar `gold` |
| `--color-on-accent` | Text on `primary`, `secondary` and `danger` buttons |
| `--color-on-warning` | Text on a `warning` button |
| `--color-on-gold` | Text on a `gold` badge |
| `--color-scrim` | Modal backdrop (drawn at 60% opacity) |

`--color-on-accent`, `--color-on-warning`, `--color-on-gold` and `--color-scrim` exist so that no
primitive hardcodes a hex value. Choose each for contrast against the surface it sits on.

## Other tokens

| Token | Used by |
| --- | --- |
| `--shadow-card` | Card, Button, SegmentedControl active segment |

## Variant

Badge switches its `primary` and `warning` text colour in dark mode, so the product must register a
`dark` variant, for example:

```css
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
```
