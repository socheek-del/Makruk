# Sittuyin design identity — "Daung" (ဒေါင်း, peacock)

sit-005. The Sittuyin site must look like its own product, not a recolour of Makruk and not like
Duolingo (root `AGENTS.md`, "Design" — the Duolingo rule is a legal decision by the owner). It is built
on the same component primitives (`@chaturanga/ui`, `@chaturanga/board-ui`), which carry shape, state
and accessibility but no palette, so the whole identity lives in this app's tokens, fonts and art.

**Status: proposed, awaiting owner approval.** sit-006 builds on this direction.

The showcase page (`apps/sittuyin/web/src/DesignPage.tsx`) renders everything below in both colour
schemes. Screenshots at the two review widths are in `evidence/`:

| | 390px (phone) | 1280px (desktop) |
| --- | --- | --- |
| Light | `evidence/design-light-390.png` | `evidence/design-light-1280.png` |
| Dark | `evidence/design-dark-390.png` | `evidence/design-dark-1280.png` |

Regenerate them with:

```bash
npm run build -w apps/sittuyin/web && npm run preview -w apps/sittuyin/web   # then, in another shell:
node apps/sittuyin/web/scripts/capture-design.mjs
```

## The idea

Two Burmese things carry the identity:

- **The green peacock** (ဒေါင်း), the old royal and national emblem, gives the interface its colour: a
  peacock teal that reads blue-green, with an aubergine companion from court textiles.
- **Lacquerware** (ယွန်း, *yun*), Bagan's craft, gives the board and the pieces their colour: cinnabar
  red over black, incised and filled with a dull brass.

The interface is cool and calm; the board is warm and saturated. That split is deliberate — the board
is the thing you look at for an hour, and it should not compete with the chrome around it.

## How this differs from Makruk

Makruk's "Wat" theme is temple paper and indigo on a teak board. Every identity-bearing choice differs:

| | Makruk ("Wat") | Sittuyin ("Daung") |
| --- | --- | --- |
| Primary hue | Indigo (~235°) | Peacock teal (~193°) |
| Secondary | Jade green (~165°) | Aubergine (~305°) |
| Canvas | Warm cream paper | Cool pale ash |
| Board | Teak, honey brown | Lacquer, cinnabar red |
| Board markings | Grid lines only | Grid lines plus the two promotion diagonals |
| Type | Prompt (Thai) | Noto Sans Myanmar + Noto Sans |
| Piece art | Carved abstract silhouettes | Figurative lacquer forms |
| Ornament | Gold lattice diamonds | Peacock-eye roundel |

A person who has seen both sites should not have to read a word to know which one they are on.

## Colour tokens

The token names are the contract in `packages/ui/TOKENS.md`; these are Sittuyin's values. Contrast was
chosen so body text on its surface clears WCAG AA (4.5:1) and large text and chrome clear 3:1.

### Light

| Token | Value | Note |
| --- | --- | --- |
| `--canvas` | `#eff2f2` | Pale ash with a green cast |
| `--surface` | `#ffffff` | |
| `--surface-2` | `#e2e8e9` | |
| `--line` | `#cdd7d9` | |
| `--ink` | `#12242a` | Deep peacock black |
| `--muted` | `#4e666f` | |
| `--subtle` | `#8aa0a8` | |
| `--primary` | `#0f6f86` | Peacock teal |
| `--primary-shadow` | `#0b5568` | |
| `--primary-soft` | `#dcedf2` | |
| `--secondary` | `#6d3f6b` | Aubergine |
| `--secondary-shadow` | `#54304f` | |
| `--secondary-soft` | `#f0e4ef` | |
| `--danger` | `#b3202b` | |
| `--danger-shadow` | `#8b1821` | |
| `--danger-soft` | `#f7e0e1` | |
| `--warning` | `#c08410` | Turmeric |
| `--warning-shadow` | `#94660c` | |
| `--warning-soft` | `#f8ecd0` | |
| `--gold` | `#a8802f` | Dull brass, not bright gold |
| `--gold-shadow` | `#846326` | |
| `--on-accent` | `#ffffff` | |
| `--on-warning` | `#2b2006` | |
| `--on-gold` | `#12242a` | |
| `--scrim` | `#0b161a` | |

### Dark

Dark is not an inversion: the canvas goes to deep peacock black and the accents lift to plume tints.

| Token | Value |
| --- | --- |
| `--canvas` | `#0d1a1f` |
| `--surface` | `#152329` |
| `--surface-2` | `#1f3038` |
| `--line` | `#2d434d` |
| `--ink` | `#e9f1f3` |
| `--muted` | `#a2b8c0` |
| `--subtle` | `#6b8590` |
| `--primary` | `#5cc0d6` |
| `--primary-shadow` | `#3ba2ba` |
| `--primary-soft` | `#123c49` |
| `--secondary` | `#c99ac6` |
| `--secondary-shadow` | `#a97aa6` |
| `--secondary-soft` | `#38203a` |
| `--danger` | `#f08a86` |
| `--danger-shadow` | `#d16a66` |
| `--danger-soft` | `#3d1f21` |
| `--warning` | `#eec25c` |
| `--warning-shadow` | `#d0a340` |
| `--warning-soft` | `#372c13` |
| `--gold` | `#d9b263` |
| `--gold-shadow` | `#b89345` |
| `--on-accent` | `#0d1a1f` |
| `--on-warning` | `#2b2006` |
| `--on-gold` | `#12242a` |
| `--scrim` | `#040b0d` |

## Typography

- **Burmese: Noto Sans Myanmar** (SIL OFL), self-hosted through `@fontsource` so the PWA works
  offline. Unicode only — never Zawgyi, which encodes the same text differently and would render as
  mojibake for Unicode readers.
- **Latin: Noto Sans** (SIL OFL), the matching companion, so mixed Burmese/English lines share a
  skeleton.
- **Line height.** Burmese stacks marks above and below the baseline, so the usual 1.5 clips. The body
  line height is `1.75`, set once as `--leading-my`. Do not tighten it on Burmese text.
- **No condensed or heavy Burmese weights.** Burmese letterforms lose their counters when squeezed;
  emphasis comes from colour and size, not from compression.
- Headings use 600, not 800. Very heavy type is part of what makes an interface read as Duolingo-like,
  and Burmese does not take it well.

## Board

- 8×8, un-checkered, like Makruk — but in **lacquer**: a cinnabar field with near-black grid lines.
- The **two promotion diagonals are drawn in brass**, through `board-ui`'s `overlay` prop. This is the
  one board marking Sittuyin needs and Makruk does not: a Ne promotes on its own side's long diagonal,
  so the lines are rules made visible, not decoration. They are drawn over the squares and over the
  pieces, so they stay thin — a heavier line would cut through the art.
- Themes shipped: `lacquer` (default), `thanaka` (pale, low contrast), `jade`, `teak-night` (dark) and
  `contrast` (black on white, for low vision). Every theme keeps the brass diagonals legible.
- Highlights: last move in brass, selection in peacock, check in ruby — the same roles as Makruk, in
  Sittuyin's palette.

## Piece art — the "yun" set

Six types per colour, drawn in-house on a 100×100 grid with heavy rounded outlines, following
Bagan lacquerware: a filled silhouette, one incised brass line, one soft highlight.

| Type | Burmese | Form |
| --- | --- | --- |
| `k` | မင်းကြီး Min-gyi | Seated figure under a *hti* — the tiered royal umbrella |
| `f` | စစ်ကဲ Sit-ke | Flame-edged shield; a promoted Ne is a Sit-ke with a brass ring at its foot |
| `s` | ဆင် Sin | Elephant head in profile, one tusk forward |
| `n` | မြင်း Myin | Horse head with a cut mane, facing the opposite way to Makruk's Ma |
| `r` | ရထား Yahhta | Chariot: a spoked wheel behind a curved body |
| `p` | နေ Ne | Small conical figure with a topknot |

Rules the art must keep:

- **Readable at 40px.** Every silhouette is distinguishable by outline alone at a 40px square, with no
  colour and no detail — that is the size a phone board uses.
- **Silhouette first.** The brass incision and the highlight are decoration; remove them and the piece
  is still identifiable.
- **Two colours only.** "White" is thanaka cream over a warm shade, "Black" is lacquer black over
  cinnabar. Both sit on the same board without either disappearing.
- A promoted Ne reads as a Sit-ke, because that is what it is, with a brass ring so a player can see
  which Sit-ke was promoted.

## Ornament and mascot

- **Peacock-eye roundel**: a simple concentric eye from the peacock's train, used at low opacity behind
  hero areas. It replaces Makruk's gold lattice; it is never used behind body text.
- **Mascot**: a small green peacock, drawn in the same flat lacquer style as the pieces. It appears in
  lessons only. It is not a rounded cartoon character with big eyes — that is Duolingo's territory.

## What is deliberately not here

- No zig-zag lesson path, no chunky extruded buttons, no bright multi-colour confetti palette. The
  lesson path is a straight row of lacquer roundels.
- No Makruk asset is reused. The two products share code, never art.
