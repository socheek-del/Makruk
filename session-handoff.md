# Session Handoff

## Verified Now

- What is currently working: 37 of 39 features passing (see `feature_list.json`). Production at
  https://th-chess.beanroti.com is deployed from `main` by CI.
- What verification actually ran: `npm run verify` (lint, typecheck, unit tests: engine, ai, web,
  worker in workerd); full Playwright E2E suite (62) locally; account E2E (3/3) and computer E2E (5/5)
  after the latest changes; bot strength ladder for all five level pairs on GitHub Actions
  (`.github/workflows/strength.yml`); production smoke of the account endpoints.

## Changed This Session

- Code or behavior added: username + password accounts with email confirmation and email password reset
  (Google sign-in removed at the owner's request; migration `0002_password_auth`); AI search checks the
  opponent's reply for repetition, noise-free bots skip exact root scores (L6 depth cap 8), endgame
  trade-down bonus, L4 noise 30 with 2% random moves.
- Infrastructure or harness changes: resumable, shardable strength ladder with seeded paired openings and
  per-game logs; on-demand "Bot strength ladder" workflow (5 runners × 4 shards + verdict job).

## Broken Or Unverified

- Known defect: none open. AI can still draw some Met-only mates against a bare Khun on the count.
- Unverified path: real email delivery in production (no Resend key yet; registration reports
  `accounts:false` until set). Thai copy has not had a native review.
- Risk for the next session: the laptop runs out of memory under long local jobs — use the Actions
  ladder, not a local run, for L5/L6 pairs. Any change to search, evaluation or bot configs invalidates
  ladder evidence and needs a re-run.

## Next Best Step

- Highest-priority unfinished feature: `acct-002` (blocked on the owner) then `polish-002` (blocked on a
  native Thai reviewer).
- Why it is next: they are the only features not passing.
- What counts as passing: `acct-002` — with `RESEND_API_KEY` and `EMAIL_FROM` set as Worker secrets,
  register on production, receive and follow the confirmation email, sign in, request and complete a
  password reset from the emailed link; record evidence. `polish-002` — reviewer completes
  `docs/i18n-review.md` sign-off and corrections are applied.
- What must not change during that step: no Google/OAuth sign-in; `DEV_EMAIL_OUTBOX` stays off in
  production.

## Commands

- Startup: `./init.sh`
- Verification: `npm run verify` · `npm run e2e`
- Focused debug command: `gh workflow run strength.yml -R socheek-del/Makruk -f pair=5 -f games=20`
