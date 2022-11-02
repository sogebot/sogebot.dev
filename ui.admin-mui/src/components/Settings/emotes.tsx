import { ArrowUpwardTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useEffect, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesCoreEmotes: React.FC<{
  onTop: () => void,
  onVisible: () => void,
}> = ({
  onTop,
  onVisible,
}) => {
  const socketEndpoint = '/core/emotes';

  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ loading, setLoading ] = useState(true);
  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  // const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise<void>((resolve, reject) => {
      getSocket(socketEndpoint)
        .emit('settings', (err, _settings: {
          [x: string]: any
        }, /* _ui: {
          [x: string]: {
            [attr: string]: any
          }
        }*/ ) => {
          if (err) {
            reject(err);
            return;
          }
          // setUI(_ui);
          setSettings(_settings);
          resolve();
        });
    });
    setLoading(false);
  }, [ ]);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ saving, setSaving ] = useState(false);
  const save = useCallback(() => {
    if (settings) {
      setSaving(true);
      saveSettings(socketEndpoint, settings)
        .then(() => {
          enqueueSnackbar('Settings saved.', { variant: 'success' });
        })
        .finally(() => setSaving(false));
    }
  }, [ settings, enqueueSnackbar ]);

  const handleChange = (key: string, value: any): void => {
    setSettings((settingsObj) => {
      return settingsObj ? {
        ...settingsObj,
        [key]: [
          value,
          settingsObj[key][1],
        ],
      } : null;
    });
  };

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (<Box ref={ref}>
    <Button id="emotes" sx={{ mb: 1 }}onClick={onTop}><ArrowUpwardTwoTone sx={{ pr: 1 }}/>TOP</Button>
    <Typography variant='h1' sx={{ pb: 2 }}>{ translate('menu.emotes')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.bttv[0]} onChange={(_, checked) => handleChange('bttv', checked)} />} label="BetterTTV" />
      </FormGroup>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.ffz[0]} onChange={(_, checked) => handleChange('ffz', checked)} />} label="FrankenFaceZ" />
      </FormGroup>

      <TextField
        fullWidth
        label='7TV emote set'
        helperText='7TV is enabled when input is populated. Login into https://7tv.app/ and paste your emote-sets url like https://7tv.app/emote-sets/<id>'
        variant="filled"
        value={settings['7tvEmoteSet'][0]}
        placeholder='https://7tv.app/emote-sets/<id>'
        onChange={(event) => handleChange('7tvEmoteSet', event.target.value)}
      />
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};

export default PageSettingsModulesCoreEmotes;
