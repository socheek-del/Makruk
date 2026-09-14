/**
 * Game-independent computer-opponent core: alpha-beta search over a SearchAdapter, bot personas and
 * move picking. Each game supplies its adapter, evaluation and bot line-up. Pure and deterministic
 * given `rng` and a node budget; runs in a Web Worker in the browser.
 */
export { type BotPersona, type EngineMove, pickRootMove } from './persona';
export { mulberry32 } from './random';
export { MATE, type RootMove, search, type SearchAdapter, type SearchOptions, type SearchResult } from './search';
