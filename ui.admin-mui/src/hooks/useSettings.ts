import {
  cloneDeep, get, set,
} from 'lodash';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { ClientToServerEventsWithNamespace } from '~/../backend/d.ts/src/helpers/socket';

import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { usePermissions } from '~/src/hooks/usePermissions';

export const useSettings = (endpoint: keyof ClientToServerEventsWithNamespace) => {
  const { enqueueSnackbar } = useSnackbar();
  const { permissions } = usePermissions();

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
    console.log({
      key, value,
    });
    setSettings((settingsObj) => {
      if (!settingsObj) {
        return null;
      }
      const newSettingsObj = cloneDeep(settingsObj);
      set(newSettingsObj, key, [value, get(settingsObj, `${key}[1]`)]);
      return newSettingsObj;
    });
  };

  const getPermissionSettingsValue = useCallback((permId: string, values: { [x: string]: string | null }) => {
    const startingOrder = get(permissions.find(permission => permission.id === permId), 'order', permissions.length);
    for (let i = startingOrder; i <= permissions.length; i++) {
      const value = values[get(permissions.find(permission => permission.order === i), 'id', '0efd7b1c-e460-4167-8e06-8aaf2c170311' /* viewers */)];
      if (typeof value !== 'undefined' && value !== null) {
        return value;
      }
    }

    // if order is last -> mirror viewers values
    console.debug(`Value for ${permId} not found in ${JSON.stringify(values)}`);
    return values['0efd7b1c-e460-4167-8e06-8aaf2c170311' /* viewers */];
  }, [ permissions ]);

  const handleChangePermissionBased = useCallback((key: string, pid: string, value?: any): void => {
    key = `__permission_based__.` + key;
    console.log({
      key, pid, value,
    });
    setSettings((settingsObj) => {
      if (!settingsObj) {
        return null;
      }
      const newSettingsObj = cloneDeep(settingsObj);
      const currentValues = get(newSettingsObj, key, {});
      console.log({
        newSettingsObj, currentValues,
      });

      if (typeof value === 'undefined') {
        // we don't have any value (toggling between locked and unlocked state)
        if (currentValues[0][pid] === null) {
          // unlock
          currentValues[0][pid] = getPermissionSettingsValue(pid, currentValues[0]);
        } else {
          currentValues[0][pid] = null;
        }
      } else {
        currentValues[0][pid] = value;
      }
      set(newSettingsObj, key, currentValues);
      return newSettingsObj;
    });
  }, [ getPermissionSettingsValue ]);

  return {
    loading, saving, settings, ui, refresh, save, setSettings, handleChange, handleChangePermissionBased, setLoading, getPermissionSettingsValue,
  };
};