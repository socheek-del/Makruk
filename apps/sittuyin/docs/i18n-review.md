# Burmese translation review (sit-011)

Burmese is the default language of the Sittuyin site, so the Burmese text must read naturally and use
correct Sittuyin terminology. This review must be done by a **native Burmese speaker**, ideally someone who
plays Sittuyin. The engineering team wrote the current Burmese text; it has not been reviewed.

All Burmese text is **Unicode** (not Zawgyi). A reviewer using a Zawgyi keyboard or font should switch to
Unicode before editing. The tests cannot reliably tell Zawgyi from Unicode, because both use the same
code-point block, so check suggested text on the running site: Zawgyi text renders wrongly in the site's
Unicode font (Noto Sans Myanmar).

## What to review

| Area | Where | What to check |
|---|---|---|
| App UI | `apps/sittuyin/web/src/locales/my.json` | Natural wording, a consistent friendly tone, no English leftovers |
| Lessons | `apps/sittuyin/web/src/features/learn/lessons.ts` (`my:` strings) | Correct rules explanations, beginner-friendly wording |
| Bot personas | `my.json` → `bots.*` | Names and descriptions feel fun and respectful |
| Search results | `my.json` → `seo.*`, and `apps/sittuyin/web/index.html` (title, description, the text shown before the app starts) | Words people actually search for |
| Online play | `my.json` → `online.*` | Clear instructions for rooms, codes and quick match |
| Game names on sibling sites | `packages/family/src/games.ts` → `my:` names | How a Burmese speaker would name Thai chess |
| Install prompt | `apps/sittuyin/web/vite.config.ts` → `manifest` | App name and description |
| Share image | `apps/sittuyin/web/scripts/generate-icons.mjs` → Open Graph text | The tagline on the image |

Everything can also be reviewed in the running site (its address is in `apps/sittuyin/web/site.config.ts`;
Burmese is the default): Home, Play (computer, online, pass-and-play), Learn (all lessons), About and
Settings.

## Terminology to confirm

| Concept | Current Burmese | Notes |
|---|---|---|
| Sittuyin | စစ်တုရင် | |
| King | မင်းကြီး | |
| General (one step diagonally) | စစ်ကဲ | |
| Elephant | ဆင် | |
| Horse | မြင်း | |
| Chariot | ရထား | |
| Pawn | နေ | |
| Promoted pawn | အဆင့်တိုးထားသော စစ်ကဲ | |
| Placing pieces (setup phase) | တပ်စီစဉ်ခြင်း / အမဲချခြင်း | Both are used; pick one |
| Auto-arrange | အလိုအလျောက် စီစဉ်ရန် | |
| Promotion | အဆင့်တိုးခြင်း | |
| Check / Checkmate | ရှင်တိုက် / ရှင်သေ | |
| Stalemate | ရွှေ့စရာ မရှိတော့ပါ | |
| Counting | ရေတွက်ခြင်း | |
| Bullet / Blitz / Rapid / Classical | အလွန်မြန် / မြန် / အလယ်အလတ် / ရိုးရာ | |
| Thai chess (name on the Sittuyin site) | ထိုင်းစစ်တုရင် | |

## How to submit changes

Edit the Burmese strings directly (keys must stay the same — `npm test -w apps/sittuyin/web` fails if a key
is missing or empty), or list corrections in the table below and an engineer will apply them.

| Key or location | Current | Suggested | Reason |
|---|---|---|---|
| | | | |

## Sign-off

| Reviewer | Native Burmese speaker | Plays Sittuyin | Date | Result |
|---|---|---|---|---|
| | | | | |
