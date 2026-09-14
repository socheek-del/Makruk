/**
 * The shared game screen and its parts. Every game-specific thing — piece art, board colours, words,
 * sounds, counting rules and material values — is a prop, so a product supplies its own identity.
 *
 * These components read their words through react-i18next. The keys they need are listed in
 * `packages/game-shell/KEYS.md`; the text behind them belongs to each product's locale files.
 */
export { formatClock, type GameSound, soundForMove } from './format';
export { GameControls, type GameControlsProps } from './GameControls';
export { GameOverModal, type GameOverModalProps, resultTitleKey } from './GameOverModal';
export { GameScreen, type GameScreenProps, undoAllowed } from './GameScreen';
export { MoveList, type MoveListProps } from './MoveList';
export { PlayerBar, type PlayerBarProps } from './PlayerBar';
export { useNow } from './useNow';
