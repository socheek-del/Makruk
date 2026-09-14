import { createIdentity, storageKey } from '@chaturanga/game-shell';
import { PRODUCT } from '../../../product.config';

/**
 * Anonymous seat token for online play (acct-001), kept under `makruk.identity`. There are no accounts:
 * the token only lets the server recognise this browser, so a reload returns the player to their seat.
 */
export const identity = createIdentity(storageKey(PRODUCT, 'identity'));
