# Evaluator Rubric

Use this rubric after implementation and before final acceptance of a feature.

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Does the implemented behavior match the feature's `user_visible_behavior`? |  |  |
| Rules fidelity | For engine/AI/online work: do results agree with Makruk rules (Fairy-Stockfish reference, perft, counting rules)? |  |  |
| Verification | Did the required checks actually run, with evidence recorded? |  |  |
| Scope discipline | Did the session stay inside the chosen feature scope? |  |  |
| Localization | Are all new strings in Thai (default) and English? Does Thai text render and fit? |  |  |
| UX & design | Does it follow the design language (Duolingo-style shell, Chess.com-style game screen) and work at ~400px width? |  |  |
| Reliability | Does the result survive restart, reload, or reconnect without repair? |  |  |
| Maintainability | Is the code and documentation clear enough for the next session? |  |  |
| Handoff readiness | Can a fresh session continue work from repo artifacts only? |  |  |

Mark "n/a" for categories that do not apply to the feature.

## Verdict

- Accept
- Revise
- Block

## Required Follow-Up

- Missing evidence:
- Required fixes:
- Next review trigger:
