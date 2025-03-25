import { Overlay } from '@entity/overlay';
import { atom } from 'jotai';

export const emptyItem: Partial<Overlay> = {
  canvas: {
    height: 1080,
    width:  1920,
  },
  name:  '',
  items: [],
};

export const anItems = atom<Overlay>(Object.assign(new Overlay(), emptyItem));
export const anMoveableId = atom<null | string>(null);

export const anSelectedItem = atom(
  (get) => get(anItems).items.find(o => o.id.replace(/-/g, '') === get(anMoveableId)),
);
export const anSelectedItemCanvas = atom(get => ({
  width: get(anSelectedItem)?.width ?? 0, height: get(anSelectedItem)?.height ?? 0,
}));
export const anSelectedItemOpts = atom((get) => get(anSelectedItem)?.opts);
