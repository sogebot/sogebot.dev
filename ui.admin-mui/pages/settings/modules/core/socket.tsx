import { ArrowBackIosNewTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import {
  IsInt, IsNotEmpty, Min, validateOrReject,
} from 'class-validator';
import {
  cloneDeep, get, set,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';
import { v4 } from 'uuid';

import { NextPageWithLayout } from '~/pages/_app';
import { ConfirmButton } from '~/src/components/Buttons/ConfirmButton';
import { Layout } from '~/src/components/Layout/main';
import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

class Settings {
  @IsNotEmpty()
  @Min(120, { message: '$constraint1' })
  @IsInt()
    accessTokenExpirationTime: number;

  @IsNotEmpty()
  @Min(400000, { message: '$constraint1' })
  @IsInt()
    refreshTokenExpirationTime: number;
}

const PageSettingsModulesCoreSocket: NextPageWithLayout = () => {
  const socketEndpoint = '/core/socket';

  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, setErrors, haveErrors } = useValidator({
    translations: {
      accessTokenExpirationTime:  translate('core.socket.settings.accessTokenExpirationTime'),
      refreshTokenExpirationTime: translate('core.socket.settings.refreshTokenExpirationTime'),
    },
  });

  const [ loading, setLoading ] = useState(true);
  const [ dirty, setDirty ] = useState(false);
  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  // const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  useEffect(() => {
    if (!loading && settings) {
      const toCheck = new Settings();
      toCheck.accessTokenExpirationTime = Number(settings.connection.accessTokenExpirationTime[0]);
      toCheck.refreshTokenExpirationTime = Number(settings.connection.refreshTokenExpirationTime[0]);
      validateOrReject(toCheck, { always: true })
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [loading, settings, setErrors]);

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
      if (!settingsObj) {
        return null;
      }
      const newSettingsObj = cloneDeep(settingsObj);
      set(newSettingsObj, key, [value, get(settingsObj, `${key}[1]`)]);
      return newSettingsObj;
    });
  };

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Value copied to clipboard');
  }, [ enqueueSnackbar ]);

  const purgeAll = useCallback(() => {
    getSocket(`/core/socket`).emit('purgeAllConnections', () => {
      enqueueSnackbar('Tokens purged.', { variant: 'success' });
    });
  }, [ enqueueSnackbar ]);

  return (
    <Box sx={{
      maxWidth: 960, m: 'auto',
    }}>
      <Button sx={{ mb: 1 }} onClick={() => router.push('/settings/modules')}><ArrowBackIosNewTwoTone sx={{ pr: 1 }}/>{translate('menu.modules')}</Button>
      <Typography variant='h1' sx={{ pb: 2 }}>Socket</Typography>
      <Typography variant='h3' sx={{ pb: 2 }}>{ translate('categories.general') }</Typography>
      {settings && <Paper elevation={1} sx={{ p: 1 }}>
        <Stack spacing={1}>
          <TextField
            {...propsError('accessTokenExpirationTime')}
            fullWidth
            variant="filled"
            required
            value={settings.connection.accessTokenExpirationTime[0]}
            label={translate('core.socket.settings.accessTokenExpirationTime')}
            onChange={(event) => handleChange('connection.accessTokenExpirationTime', event.target.value)}
          />
          <TextField
            {...propsError('refreshTokenExpirationTime')}
            fullWidth
            variant="filled"
            required
            value={settings.connection.refreshTokenExpirationTime[0]}
            label={translate('core.socket.settings.refreshTokenExpirationTime')}
            onChange={(event) => handleChange('connection.refreshTokenExpirationTime', event.target.value)}
          />
          <TextField
            fullWidth
            variant="filled"
            value={'*'.repeat(30) + settings.connection.socketToken[0].slice(30)}
            label={translate('core.socket.settings.socketToken.title')}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                <Button variant='text' color="light" onClick={() => copy(settings.connection.socketToken[0])}>{ translate('systems.polls.copy') }</Button>
                <Button variant='text' color="error" onClick={() => handleChange('connection.socketToken', v4())}>{ translate('commons.generate') }</Button>
              </InputAdornment>,
            }}
          />
          <ConfirmButton variant='contained' color='error' handleOk={purgeAll}>{ translate('core.socket.settings.purgeAllConnections') }</ConfirmButton>
        </Stack>
      </Paper>
      }

      <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" disabled={!dirty || haveErrors} onClick={save}>Save changes</LoadingButton>
      </Stack>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>
    </Box>
  );
};

PageSettingsModulesCoreSocket.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsModulesCoreSocket;
