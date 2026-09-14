# Keys the shared screens read

`@chaturanga/game-shell/ui` renders words through react-i18next. The keys are shared so the components
can be; the text behind them belongs to each product's locale files, in every language that product
declares.

# Game screen

## Always required

| Key | Used for |
| --- | --- |
| `colors.w`, `colors.b` | Interpolated into the keys below as `{{color}}` |
| `play.turn` (`{{color}}`) | Turn banner |
| `play.check` | Appended to the turn banner in check |
| `play.captured` | Accessible name of a player's captured pieces |
| `play.clockOf` (`{{color}}`) | Accessible name of a clock |
| `play.moves`, `play.noMoves` | Move list heading and empty state |
| `play.first`, `play.back`, `play.forward`, `play.last` | History buttons |
| `play.flip`, `play.undo`, `play.resign` | Game buttons |
| `play.backToLive` | Leaves history review |
| `play.newGame`, `play.rematch`, `play.review` | Game-over actions |
| `play.resignConfirm` (`{{color}}`), `play.cancel` | Resign confirmation |
| `play.result.whiteWins`, `play.result.blackWins`, `play.result.draw` | Result title |
| `play.reason.<reason>` | One per `ResultReason` the variant can produce |

`play.reason.*` covers `checkmate`, `stalemate`, `repetition`, `counting`, `fifty-move`,
`insufficient-material`, `timeout`, `resign`, `agreement` and `abandon`. A product only needs the
reasons its own rules can reach — Makruk has no fifty-move rule, so it omits that one.

## Required only for some variants

| Key | Required when |
| --- | --- |
| `play.placing` (`{{color}}`) | The variant has a setup phase (`hasHands`), e.g. Sittuyin |
| `play.promote` | The variant allows promotion in place, e.g. Sittuyin |

The hand trays take their names as props (`handLabel`, `describeHandPiece`) rather than keys, because a
tray is named after the game's own pieces.

# Lesson player

Only a product with lessons needs these.

| Key | Used for |
| --- | --- |
| `learn.exit` | Accessible name of the leave-lesson button |
| `learn.progress` | Accessible name of the step progress bar |
| `learn.check` | Checks a squares or quiz answer |
| `learn.continue` | Moves on after a step, and leaves the finished screen |
| `learn.correct`, `learn.wrong` | Feedback headings |
| `learn.tryAgain` | Retries the step after a wrong answer |
| `learn.complete` | Heading of the finished screen |
| `learn.stars` (`{{count}}`) | Accessible name of the star row |
| `play.promote` | The promote-in-place button on a move step, for a variant that allows it |

The lesson's own words — prompts, hints, choices and titles — live in the lesson data rather than the
locale files, because a step's prompt, hint and choices only make sense together. `describeLessons` in
`@chaturanga/game-shell/testing` checks that each of them exists in every language the product declares.

A product whose lessons teach a setup phase also passes `handLabel` and `describeHandPiece`, the same
props the game screen's trays take.
