import {
  Button, Checkbox, Divider, Fade, FormControlLabel, InputAdornment, TextField,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Commands } from '~/src/classes/Commands';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

export const useBotCommandsSpecificSettings = (item: Commands | null) => {
  const router = useRouter();

  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const [ settings, setSettings ] = useState<Record<string, any>>({});

  const { translate } = useTranslation();

  useEffect(() => {
    setLoading(true);
  }, [ router ]);

  const handleSettingsValueChange = (key: string, val: any) => {
    setSettings((value) => {
      return {
        ...value,
        [key]: [
          val, value[key][1],
        ],
      };
    });
  };

  const handleSave = async () => {
    if (!item) {
      return;
    }

    setSaving(true);
    await Promise.all(
      Object.keys(settings).map(key => {
        return new Promise<void>(resolve => {
          getSocket(`/${item.type.toLowerCase()}/${item.name.toLowerCase()}` as any).emit('set.value', { variable: key, value: settings[key][0] }, () => {
            resolve();
          });
        });
      })
    );
  };

  const handleSetSettingsDefaultValue = (key: string) => {
    setSettings((value) => {
      return {
        ...value,
        [key]: [
          value[key][1], value[key][1],
        ],
      };
    });
  };

  useEffect(() => {
    if (!item) {
      setSettings({});
      return;
    }
    getSocket(`/${item.type.toLowerCase()}/${item.name.toLowerCase()}` as any)
      .emit('settings', (err: any, data: { [x: string]: any[]; }) => {
        if (err) {
          console.error(err);
          return;
        }

        // select all command related settings
        const commandSettings: Record<string, any> = {};
        for (const key of Object.keys(data)) {
          if (key.startsWith(item.defaultValue)) {
            commandSettings[key] = data[key];
          }
        }
        setSettings(commandSettings);
        setLoading(false);
      });
  }, [ item ]);

  const generateInput = (key: string) => {
    if (!item) {
      return <></>;
    }

    const label = translate(key.replace(`${item.defaultValue}-`, `properties.${item.defaultValue.replace('!', '')}.`));
    if (typeof settings[key][1] === 'string') {
      return <TextField
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

  const inputs = <>
    { item && Object.keys(settings).length > 0 && <Divider sx={{ pt: 3 }}>Command specific settings</Divider> }
    { item && Object.keys(settings).map(key => generateInput(key))}
  </>;

  return {
    loading, saving, inputs, handleSave,
  };
};
