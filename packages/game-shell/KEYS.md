# Keys the shared game screen reads

`@chaturanga/game-shell/ui` renders words through react-i18next. The keys are shared so the components
can be; the text behind them belongs to each product's locale files, in every language that product
declares.

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
