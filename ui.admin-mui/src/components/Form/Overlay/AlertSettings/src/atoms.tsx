import { Alerts } from '@backend/database/entity/overlay';
import { Atom, atom } from 'jotai';

import { anSelectedItemOpts } from '../../../atoms';

export const anItems = atom(get => get(anSelectedItemOpts as Atom<Alerts>)?.items ?? []);

export const anSelectedAlertId = atom('');
export const anSelectedVariantId = atom<null | string>(null);

export const anSelectedAlert = atom<null | Alerts['items'][number]>(null);
export const anSelectedAlertVariant = atom(get => {
  if (!get(anSelectedAlert)) {
    return null;
  }
  if (get(anSelectedVariantId) === null) {
    return get(anSelectedAlert);
  }
  const selectedVariant = get(anSelectedAlert)?.variants.find(o => o.id === get(anSelectedVariantId));
  return selectedVariant;
});