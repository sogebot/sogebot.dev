import {
  cloneDeep, get, set,
} from 'lodash';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { ClientToServerEventsWithNamespace } from '~/../backend/d.ts/src/helpers/socket';

import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';

export const useSettings = (endpoint: keyof ClientToServerEventsWithNamespace) => {
  const { enqueueSnackbar } = useSnackbar();

  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);

  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise<void>((resolve, reject) => {
      getSocket(endpoint)
        .emit('settings', (err, _settings: {
          [x: string]: any
        }, _ui: {
          [x: string]: {
            [attr: string]: any
          }
        } ) => {
          if (err) {
            reject(err);
            return;
          }
          setUI(_ui);
          setSettings(_settings);
          resolve();
        });
    });
    setLoading(false);
  }, [ endpoint ]);

  const save = useCallback(() => {
    if (settings) {
      setSaving(true);
      saveSettings(endpoint, settings)
        .then(() => {
          enqueueSnackbar('Settings saved.', { variant: 'success' });
        })
        .finally(() => setSaving(false));
    }
  }, [ settings, enqueueSnackbar, endpoint ]);

  const handleChange = (key: string, value: any): void => {
    setSettings((settingsObj) => {
      if (!settingsObj) {
        return null;
      }
      const newSettingsObj = cloneDeep(settingsObj);
      set(newSettingsObj, key, [value, get(settingsObj, `${key}[1]`)]);
      return newSettingsObj;
    });
  };

  return {
    loading, saving, settings, ui, refresh, save, setSettings, handleChange, setLoading,
  };
};