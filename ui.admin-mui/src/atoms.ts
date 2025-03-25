import { AlertQueue } from '@entity/overlay';
import { atom } from 'jotai';

/*
 * List of available scopes
 */
export const scopesAtom = atom<string[]>([]);

/*
 * Logged in user
 */
export const loggedUserAtom = atom<{
  id: string;
  login: string;
  profile_image_url: string;
  display_name: string;
  bot_scopes: { [server: string]: string[] };
} | null>(null);

/*
 * List of available rewards
 */
export const rewardsAtom = atom<{ id: string, name: string }[]>([]);

/*
 * List of alert queues
 */
export const alertQueueAtom = atom<AlertQueue[]>([]);