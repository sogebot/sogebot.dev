import { AlertQueue } from '@sogebot/backend/dest/database/entity/overlay';
import { atom } from 'jotai';

/*
 * List of available rewards
 */
export const rewardsAtom = atom<{ id: string, name: string }[]>([]);

/*
 * List of alert queues
 */
export const alertQueueAtom = atom<AlertQueue[]>([]);
