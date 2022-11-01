import { ArrowBackIosNewTwoTone } from '@mui/icons-material';
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
  ReactElement, useCallback, useEffect, useState,
} from 'react';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesCoreEmotes: NextPageWithLayout = () => {
  const socketEndpoint = '/core/emotes';

  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ loading, setLoading ] = useState(true);
  const [ dirty, setDirty ] = useState(false);
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
          setDirty(false);
          enqueueSnackbar('Settings saved.', { variant: 'success' });
        })
        .finally(() => setSaving(false));
    }
  }, [ settings, enqueueSnackbar ]);

  const handleChange = (key: string, value: any): void => {
    setDirty(true);
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

  return (
    <Box sx={{
      maxWidth: 960, m: 'auto',
    }}>

      <Button sx={{ mb: 1 }} onClick={() => router.push('/settings/modules')}><ArrowBackIosNewTwoTone sx={{ pr: 1 }}/>{translate('menu.modules')}</Button>

      <Typography variant='h1' sx={{ pb: 2 }}>{ translate('menu.emotes')}</Typography>
      <Typography variant='h3' sx={{ pb: 2 }}>{ translate('categories.general') }</Typography>
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
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={!dirty}>Save changes</LoadingButton>
      </Stack>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>
    </Box>
  );
};

PageSettingsModulesCoreEmotes.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsModulesCoreEmotes;
