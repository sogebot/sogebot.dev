import {
  cloneDeep, get,  set,
} from 'lodash';
import { useSnackbar } from 'notistack';
import {
  useCallback, useEffect, useState,
} from 'react';
import { ClientToServerEventsWithNamespace } from '~/../backend/d.ts/src/helpers/socket';

import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';

export const useSettings = (endpoint: keyof ClientToServerEventsWithNamespace, validator?: { [attribute: string]: ((value: string) => boolean | string)[]}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { permissions } = usePermissions();
  const { translate } = useTranslation();

  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);

  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const [ errors, setErrors ] = useState<{ propertyName: string, message: string }[]>([]);

  useEffect(() => {
    console.log({ errors });
  }, [errors]);

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

  useEffect(() => {
    setErrors([]);
    if (settings && validator) {
      for (const key of Object.keys(validator)) {
        const attr = key.includes('__permission_based__')
          ? get(settings, `${key}[0]`)
          : get(settings, `${key}`);

        if (key.includes('__permission_based__')) {
          for (const permId of Object.keys(attr)) {
            if (attr[permId] === null || attr[permId] === '%%%%___ignored___%%%%') {
              continue;
            }
            console.log('Validating', permId, attr[permId]);
            // we need to fake class-validator validation
            for (const validatorFunction of validator[key]) {
              const result = validatorFunction(attr[permId]);
              if (typeof result === 'string') {
                // we hit error
                const constraints = result.split('|');
                setErrors(errs => {
                  const newErrors = [...errs];
                  newErrors.push({
                    propertyName: `${key}|${permId}`,
                    message:      translate('errors.' + constraints[0])
                      .replace('$property', translate('properties.thisvalue'))
                      .replace('$constraint1', constraints[1]),
                  });
                  return newErrors;
                });
                break;
              }
            }
          }
        }
      }
    }
  }, [ settings, validator, translate ]);

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
        // we need to keep number/string values
        if (typeof currentValues[1]['0efd7b1c-e460-4167-8e06-8aaf2c170311'] === 'number') {
          if (isNaN(Number(value))) {
            // if it cannot be as number, keep it as is
            currentValues[0][pid] = value;
          } else {
            currentValues[0][pid] = Number(value);
          }
        } else {
          currentValues[0][pid] = value;
        }
      }
      set(newSettingsObj, key, currentValues);
      return newSettingsObj;
    });
  }, [ getPermissionSettingsValue ]);

  return {
    loading, saving, settings, ui, refresh, save, setSettings, handleChange, handleChangePermissionBased, setLoading, getPermissionSettingsValue, errors,
  };
};