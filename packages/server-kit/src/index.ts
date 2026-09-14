/**
 * Shared Cloudflare Worker pieces for online play: the room state machine, the game-room and
 * matchmaker Durable Objects, and room codes. Everything is driven by a rules Variant, so a product
 * supplies its own rules, bindings, identity and database and nothing else.
 */
export { newGuest, signPayload, signToken, verifyPayload, verifyToken } from './auth';
export { GameRoomBase, type InitOptions, type RoomEnv, type RoomStub, USER_HEADER } from './GameRoomBase';
export { currentUser, type PlayEnv, registerPlayRoutes } from './routes';
export { MatchmakerBase } from './MatchmakerBase';
export { generateRoomCode } from './roomCode';
export {
  applyMessage,
  type ApplyResult,
  createRoom,
  join,
  leave,
  nextAlarm,
  other,
  replay,
  type RoomState,
  roomStatus,
  seatOf,
  settle,
  snapshot,
} from './roomLogic';
