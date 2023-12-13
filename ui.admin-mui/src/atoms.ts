import { atom } from 'jotai';

/*
 * List of available rewards
 */
export const rewardsAtom = atom<{ id: string, name: string }[]>([]);
export const rewardsLoadedAtAtom = atom<number | null>(null);