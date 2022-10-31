import type { ClientToServerEventsWithNamespace } from '@sogebot/backend/d.ts/src/helpers/socket';
import { flatten, unflatten } from '@sogebot/backend/dest/helpers/flatten';
import { cloneDeep } from 'lodash';

import { getSocket } from '~/src/helpers/socket';

export const saveSettings = async (endpoint: keyof ClientToServerEventsWithNamespace, settings: Record<string, any>) => {
  let clonedSettings = cloneDeep(settings);

  if (clonedSettings.settings) {
    for (const [name, value] of Object.entries(clonedSettings.settings)) {
      delete clonedSettings.settings[name];
      clonedSettings[name] = value;
    }
    delete clonedSettings.settings;
  }

  // flat variables - getting rid of category
  clonedSettings = flatten(clonedSettings);
  for (const key of Object.keys(clonedSettings)) {
    if (key.includes('__permission_based__') || key.includes('commands') || key.includes('_permission')) {
      continue;
    }

    const value = clonedSettings[key];
    const keyWithoutCategory = key.replace(/([\w]*\.)/, '');
    delete clonedSettings[key];
    console.debug(`FROM: ${key}`);
    console.debug(`TO:   ${keyWithoutCategory}`);
    clonedSettings[keyWithoutCategory] = value;
  }
  clonedSettings = unflatten(clonedSettings);

  // flat permission based variables - getting rid of category
  if (clonedSettings.__permission_based__) {
    clonedSettings.__permission_based__ = flatten(clonedSettings.__permission_based__);
    for (const key of Object.keys(clonedSettings.__permission_based__)) {
      const match = key.match(/\./g);
      if (match && match.length === 1) {
        const value = clonedSettings.__permission_based__[key];
        delete clonedSettings.__permission_based__[key];
        const keyWithoutCategory = key.replace(/([\w]*\.)/, '');
        console.debug(`FROM: ${key}`);
        console.debug(`TO:   ${keyWithoutCategory}`);
        clonedSettings.__permission_based__[keyWithoutCategory] = value[0];
      }
    }
    clonedSettings.__permission_based__ = unflatten(clonedSettings.__permission_based__);
  }

  for (const key of Object.keys(clonedSettings)) {
    clonedSettings[key] = Array.isArray(clonedSettings[key])
      ? clonedSettings[key][0] // select current values
      : clonedSettings[key];
  }

  console.log({ clonedSettings });

  return new Promise((resolve, reject) => {
    getSocket(endpoint).emit('settings.update', clonedSettings, (err) => {
      if (err) {
        return reject(err);
      } else {
        getSocket(endpoint).emit('settings.refresh');
        resolve(true);
      }
    });
  });
};
