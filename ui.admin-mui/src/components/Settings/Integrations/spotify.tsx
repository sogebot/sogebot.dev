import { LoadingButton } from '@mui/lab';
import { Box, Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, Grid, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntervalWhen, useRefElement } from 'rooks';

import getAccessToken from '../../../getAccessToken';
import { baseURL } from '../../../helpers/getBaseURL';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useScope } from '../../../hooks/useScope';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { SettingsSystemsDialogStringArray } from '../Dialog/StringArray';

const PageSettingsModulesIntegrationsSpotify: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const scope = useScope('integrations');
  const { translate } = useTranslation();

  const { settings, loading, refresh, handleChange, TextFieldProps, saving, save } = useSettings('/integrations/spotify' as any);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    refresh();
  }, [ ]);

  const user = useMemo(() => {
    if (settings && settings.connection.username[0].length > 0) {
      return settings.connection.username[0];
    }
    return 'Not Authorized';
  }, [settings]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const revoke = useCallback(() => {
    axios.post('/api/integrations/spotify/?_action=revoke', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      enqueueSnackbar('User access revoked.', { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  const authorize = useCallback(async () => {
    // enable module
    await new Promise<void>(resolve => {
      axios.post(`/api/settings/integrations/spotify`, { enabled: true }, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      }).then(() => {
        resolve();
      }).catch(console.error);
    });
    // save changes
    await save();
    const popup = window.open(baseURL + '/credentials/spotify', 'popup', 'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no');
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        refresh();
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [ enqueueSnackbar, save ]);

  const [ lastActiveDevice, setLastActiveDevice ] = useState('');
  useIntervalWhen(() => {
    axios.get('/api/settings/integrations/spotify/lastActiveDeviceId', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data }) => {
      setLastActiveDevice(data.data);
    });
  }, 1000, true, true);

  return (loading ? null : <Box ref={ref} id="spotify">
    <Typography variant='h2' sx={{ pb: 2 }}>Spotify</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.songRequests[0]} onChange={(_, checked) => handleChange('songRequests', checked)} />}
            label={translate('integrations.spotify.settings.songRequests')} />
        </FormGroup>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.fetchCurrentSongWhenOffline[0]} onChange={(_, checked) => handleChange('fetchCurrentSongWhenOffline', checked)} />}
            label={<>
              {translate('integrations.spotify.settings.fetchCurrentSongWhenOffline.title')}
              <FormHelperText>{translate('integrations.spotify.settings.fetchCurrentSongWhenOffline.help')}</FormHelperText>
            </>}
          />
        </FormGroup>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.queueWhenOffline[0]} onChange={(_, checked) => handleChange('queueWhenOffline', checked)} />}
            label={<>
              {translate('integrations.spotify.settings.queueWhenOffline.title')}
              <FormHelperText>{translate('integrations.spotify.settings.queueWhenOffline.help')}</FormHelperText>
            </>}
          />
        </FormGroup>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.notify[0]} onChange={(_, checked) => handleChange('notify', checked)} />}
            label={translate('integrations.spotify.settings.notify')} />
        </FormGroup>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.allowApprovedArtistsOnly[0]} onChange={(_, checked) => handleChange('allowApprovedArtistsOnly', checked)} />}
            label={translate('integrations.spotify.settings.allowApprovedArtistsOnly')} />
        </FormGroup>

        <Grid container alignItems='center'>
          <Grid item>
            <Typography>{ translate('integrations.spotify.settings.approvedArtists.title') }</Typography>
          </Grid>
          <Grid item sx={{ pl: 2 }}>
            <SettingsSystemsDialogStringArray helperText={translate('integrations.spotify.settings.approvedArtists.help')} title={translate('integrations.spotify.settings.approvedArtists.title')} items={settings.approvedArtists[0]} onChange={(value) => handleChange('approvedArtists', value)} />
          </Grid>
        </Grid>
      </Stack>
    </Paper>}

    {scope.sensitive && <>
      <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.connection') }</Typography>
      {settings && <Paper elevation={1} sx={{ p: 1 }}>
        <Stack spacing={1}>
          <TextField
            {...TextFieldProps('connection.clientId')}
            type="password"
            label={translate('integrations.spotify.settings.clientId')}
          />
          <TextField
            {...TextFieldProps('connection.clientSecret')}
            type="password"
            label={translate('integrations.spotify.settings.clientSecret')}
          />
          <TextField
            {...TextFieldProps('connection.redirectURI')}
            label={translate('integrations.spotify.settings.redirectURI')}
          />
          <TextField
            disabled
            variant='filled'
            value={user}
            label={translate('integrations.lastfm.settings.username')}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                { user !== 'Not Authorized'
                  ? <Button color="error" variant="contained" onClick={revoke}>Revoke</Button>
                  : <Button color="success" variant="contained" onClick={authorize}>Authorize</Button>
                }
              </InputAdornment>,
            }}
          />
          <TextField
            {...TextFieldProps('connection.manualDeviceId', { helperText: translate('integrations.spotify.settings.manualDeviceId.help') })}
            label={translate('integrations.spotify.settings.manualDeviceId.title')}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                {lastActiveDevice.length > 0
                  ? <>
                    <Button onClick={() => handleChange('connection.manualDeviceId', lastActiveDevice)}>{lastActiveDevice}</Button>
                  </>
                  : ''}
              </InputAdornment>,
            }}
          />
        </Stack>
      </Paper>}
    </>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesIntegrationsSpotify;
