# Thai translation review (polish-002)

Thai is the default language of หมากรุกไทย, so the Thai text must read naturally and
use correct Makruk terminology. This review must be done by a **native Thai speaker**,
ideally someone who plays Makruk. The engineering team wrote the current Thai text;
it has not been reviewed.

## What to review

| Area | Where | What to check |
|---|---|---|
| App UI | `apps/web/src/locales/th.json` | Natural wording, consistent tone (friendly, Duolingo-style), no English leftovers |
| Lessons | `apps/web/src/features/learn/lessons.ts` (`th:` strings) | Correct rules explanations, beginner-friendly wording |
| Coach tips | `th.json` → `coach.*` | Short, encouraging, accurate advice |
| Bot personas | `th.json` → `bots.*` | Names and descriptions feel fun and respectful |
| Email | `apps/worker/src/accounts/routes.ts` → `magicLinkEmail` | Subject and body |
| Store listing / manifest | `apps/web/vite.config.ts` → `manifest` | App name and description |

Everything can also be reviewed in the running app: open https://th-chess.beanroti.com
(Thai is the default) and go through Home, Play (pass-and-play, computer, online), Learn
(all lessons), Account and Settings.

## Terminology to confirm

| Concept | Current Thai | Notes |
|---|---|---|
| King | ขุน | |
| Queen-like piece | เม็ด | |
| Bishop-like piece | โคน | |
| Knight | ม้า | |
| Rook | เรือ | |
| Pawn | เบี้ย | |
| Promoted pawn | เบี้ยหงาย | |
| Check / Checkmate | รุก / รุกจน | |
| Stalemate | อับ | |
| Board's honour counting | นับศักดิ์กระดาน | |
| Pieces' honour counting | นับศักดิ์หมาก | |
| Threefold repetition | ตำแหน่งซ้ำสามครั้ง | |
| Rated / Casual | นับคะแนน / ไม่นับคะแนน | |
| Bullet / Blitz / Rapid / Classical | บุลเล็ต / บลิตซ์ / แรพิด / คลาสสิก | Consider Thai alternatives |

## How to submit changes

Edit the Thai strings directly (keys must stay the same — `npm run test -w apps/web`
fails if a key is missing or empty), or list corrections in the table below and an
engineer will apply them.

| Key or location | Current | Suggested | Reason |
|---|---|---|---|
| | | | |

## Sign-off

| Reviewer | Native Thai speaker | Plays Makruk | Date | Result |
|---|---|---|---|---|
| | | | | |
