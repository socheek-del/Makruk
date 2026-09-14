# Contributing to Makruk · หมากรุกไทย

Thanks for helping make Thai chess easier to learn and play! Bug reports, rule corrections, lessons,
translations, art and code are all welcome.

## Ways to help

- **Report a bug or suggest an idea** — [open an issue](https://github.com/socheek-del/Makruk/issues/new).
  Include the page, your device/browser, and steps to reproduce.
- **Check the Thai text** — native Thai speakers can review wording and Makruk terminology using
  [`docs/i18n-review.md`](docs/i18n-review.md).
- **Rules questions** — the engine follows Fairy-Stockfish's `makruk` variant; see
  [`docs/rules.md`](docs/rules.md). If you think a rule is wrong, open an issue with a position (FEN).
- **Code, lessons and art** — pick an issue or propose a change, then open a pull request.

## Development setup

```bash
nvm use            # Node version from .nvmrc
./init.sh          # installs dependencies (npm 11) and runs the full verification
npm run dev        # web on http://localhost:5173, worker on :8787
```

Project layout:

| Path | What lives there |
|---|---|
| `packages/engine` | Pure Makruk rules (moves, check, counting rules, FEN) |
| `packages/ai` | Computer opponents (search + evaluation, runs in a Web Worker) |
| `packages/protocol` | Shared request and WebSocket message schemas |
| `apps/web` | React PWA (board, lessons, pass-and-play, online client) |
| `apps/worker` | Cloudflare Worker: API, online game rooms (Durable Objects), matchmaking |

## Before you open a pull request

- `npm run verify` passes (lint, type checks, unit tests in every workspace).
- `npm run e2e` passes for UI changes (Playwright starts the web app and a local worker).
- Every user-visible string has both a Thai (`th.json`) and an English (`en.json`) translation —
  Thai is the default language.
- Rules changes come with engine tests; changes to the computer opponents should re-run the
  strength ladder (Actions → "Bot strength ladder").
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:` …).

Product rules: no chat of any kind in online play, and the server validates every online move.

## License

By contributing you agree that your contributions are licensed under the project's
[GPL-3.0-or-later](LICENSE) license.
