import { Button, Checkbox, Divider, Fade, FormControlLabel, InputAdornment, TextField } from '@mui/material';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useSettings } from './useSettings';
import { useTranslation } from './useTranslation';
import { Commands } from '../classes/Commands';

export const useBotCommandsSpecificSettings = (item: Commands | null) => {
  const location = useLocation();

  const { loading, refresh, settings: settings, setSettings, save, saving, settingsInitial } = useSettings(!item ? null : `/${item.type.toLowerCase()}/${item.name.toLowerCase()}`, undefined, true);

  const { translate } = useTranslation();

  useEffect(() => {
    refresh();
  }, [location]);

  const handleSettingsValueChange = (key: string, val: any) => {
    setSettings((value) => {
      return {
        ...value,
        [key]: [
          val, settingsInitial![key][1],
        ],
      };
    });
  };

  const handleSave = async () => {
    save();
  };

  const handleSetSettingsDefaultValue = (key: string) => {
    setSettings((value) => {
      return {
        ...value,
        [key]: [
          settingsInitial![key][1], settingsInitial![key][1],
        ],
      };
    });
  };

  const generateInput = (key: string) => {
    if (!item || !settings) {
      return <></>;
    }

    const label = translate(key.replace(`${item.defaultValue}-`, `properties.${item.defaultValue.replace('!', '')}.`));
    if (typeof settings[key][1] === 'string') {
      return <TextField
        fullWidth
        key={key}
        variant="filled"
        value={settings[key][0]}
        required
        multiline
        onKeyPress={(e) => {
          e.key === 'Enter' && e.preventDefault();
        }}
        label={label}
        InputProps={{
          endAdornment:
        <Fade in={settings[key][0] !== settings[key][1]}>
          <InputAdornment position="end" sx={{ transform: 'translateY(-7px)' }}>
            <Button onClick={() => handleSetSettingsDefaultValue(key)}>
            set to default
            </Button>
          </InputAdornment>
        </Fade>,
        }}
        onChange={(event) => handleSettingsValueChange(key, event.target.value)}
      />;
    } else if (typeof settings[key][1] === 'boolean') {
      return <FormControlLabel
        key={key}
        label={label}
        control={
          <Checkbox checked={settings[key][0]}
            onChange={(ev, value) => handleSettingsValueChange(key, value)} />
        }
      />;
    }

    return <></>;
  };

  const inputs = !settings ? <></> : <>
    { item && Object.keys(settings).filter(o => o.startsWith(item.defaultValue)).length > 0 && <Divider sx={{ pt: 3 }}>Command specific settings</Divider> }
    { item && Object.keys(settings).filter(o => o.startsWith(item.defaultValue)).map(key => generateInput(key))}
  </>;

  return {
    loading, saving, inputs, handleSave,
  };
};
