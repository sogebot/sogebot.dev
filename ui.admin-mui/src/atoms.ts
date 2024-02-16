import { AlertQueue } from '@sogebot/backend/dest/database/entity/overlay';
import { atom } from 'jotai';

/*
 * List of available copes
 */
export const scopesAtom = atom<string[]>([]);

/*
 * Logged in user
 */
export const loggedUserAtom = atom<{
  bot_scopes: { [server: string]: string[] };
} | null>(JSON.parse(localStorage.getItem('cached-logged-user') || 'null'));

/*
 * List of available rewards
 */
export const rewardsAtom = atom<{ id: string, name: string }[]>([]);

/*
 * List of alert queues
 */
export const alertQueueAtom = atom<AlertQueue[]>([]);