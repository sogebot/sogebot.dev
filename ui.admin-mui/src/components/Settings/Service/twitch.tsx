import { Alert, LoadingButton } from '@mui/lab';
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, InputAdornment, InputLabel, Link, MenuItem, Paper, Stack, Typography } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import Select from '@mui/material/Select/Select';
import { SxProps, Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useLocalstorageState, useRefElement } from 'rooks';

import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { SettingsSystemsDialogStringArray } from '../Dialog/StringArray';

const PageSettingsModulesServiceTwitch: React.FC<{
  onVisible: () => void,
  sx?:       SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {

  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/services/twitch');
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  const handleSave = useCallback(async () => {
    // save settings
    save();
  }, [ save ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const redirectUri = useMemo(() => {
    return `${process.env.PUBLIC_URL !== '/' ? window.location.origin + '/' : process.env.PUBLIC_URL}credentials/oauth/tokens`;
  }, []);

  const botUrl = useMemo(() => {
    if (!settings) {
      return '';
    }

    const scopes = [
      'clips:edit',
      'user:edit:broadcast',
      'user:read:broadcast',
      'chat:read',
      'chat:edit',
      'channel:moderate',
      'whispers:read',
      'whispers:edit',
      'channel:edit:commercial',
      'moderator:manage:announcements',
      'moderator:manage:chat_messages',
      'moderator:manage:banned_users',
      'moderator:read:chatters',
      'user:manage:whispers',
      'bits:read',
      'moderator:manage:chat_settings',
    ];

    const clientId = settings.general.tokenServiceCustomClientId[0];
    const clientSecret = settings.general.tokenServiceCustomClientSecret[0];

    if (settings.general.tokenService[0] === 'SogeBot Token Generator v2') {
      return null;
    } else {
      return `${redirectUri}?scope=${scopes.join(' ')}&clientId=${clientId}&clientSecret=${clientSecret}&type=bot`;
    }
  }, [settings, redirectUri ]);

  const broadcasterUrl = useMemo(() => {
    if (!settings) {
      return '';
    }

    const scopes = [
      'channel_editor',
      'chat:read',
      'chat:edit',
      'channel:moderate',
      'channel:read:subscriptions',
      'channel:manage:vips',
      'user:edit:broadcast',
      'user:read:broadcast',
      'channel:edit:commercial',
      'channel:read:redemptions',
      'moderation:read',
      'channel:read:hype_train',
      'moderator:read:chatters',
      'channel:read:polls',
      'channel:read:predictions',
      'channel:manage:polls',
      'channel:manage:predictions',
      'channel:manage:moderators',
      'moderator:manage:banned_users',
      'moderator:read:followers',
      'bits:read',
    ];
    const clientId = settings.general.tokenServiceCustomClientId[0];
    const clientSecret = settings.general.tokenServiceCustomClientSecret[0];

    if (settings.general.tokenService[0] === 'SogeBot Token Generator v2') {
      return null;
    } else {
      return `${redirectUri}?scope=${scopes.join(' ')}&clientId=${clientId}&clientSecret=${clientSecret}&type=broadcaster`;
    }
  }, [settings, redirectUri ]);

  const revoke = useCallback((accountType: 'bot' | 'broadcaster') => {
    getSocket('/services/twitch').emit('twitch::revoke', { accountType }, () => {
      enqueueSnackbar('User access revoked.', { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh ]);

  const authorize = useCallback((accountType: 'bot' | 'broadcaster') => {
    const url = accountType === 'bot' ? botUrl : broadcasterUrl;
    const popup = window.open(url ?? '/credentials/twitch/?type=' + accountType, 'popup', 'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no');
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        setTimeout(() => refresh(), 5000);
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [ enqueueSnackbar, refresh, botUrl, broadcasterUrl ]);

  return (loading ? null : <Box ref={ref} sx={sx} id="twitch">
    <Typography variant='h2' sx={{ pb: 2 }}>Twitch</Typography>
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('categories.oauth')}</Typography>
    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.general')}</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <FormControl fullWidth variant='filled'>
          <InputLabel id="token-generator-label">Token Generator</InputLabel>
          <Select
            labelId="token-generator-label"
            id="token-generator-select"
            variant='filled'
            value={settings.general.tokenService[0]}
            label="Token Generator"
            onChange={(event) => handleChange('general.tokenService', event.target.value)}
          >
            <MenuItem value='SogeBot Token Generator v2'>SogeBot Token Generator v2</MenuItem>
            <MenuItem value='Own Twitch App'>Own Twitch App</MenuItem>
          </Select>
          <FormHelperText>If you change token generator, you need to re-do all tokens!</FormHelperText>
        </FormControl>

        <Collapse in={settings.general.tokenService[0] === 'Own Twitch App'} unmountOnExit>
          <Stack spacing={1}>
            <Alert severity="info" icon={false}>
              <ol>
                <li>Go to <Link
                  href="https://dev.twitch.tv/console/apps"
                  target="_blank" rel="noreferrer"
                >https://dev.twitch.tv/console/apps</Link> and register your app</li>
                <li>You can choose any <strong>name</strong> of app you want</li>
                <li>Set <strong>oauth redirect</strong> to your { redirectUri }</li>
                <li>Pick Application Integration for <strong>category</strong> and create</li>
                <li>After creation copy clientId and generate clientSecret</li>
              </ol>
            </Alert>
            <TextField
              variant='filled'
              fullWidth
              value={settings.general.tokenServiceCustomClientId[0]}
              label={capitalize(translate('integrations.spotify.settings.clientId'))}
              onChange={(event) => handleChange('general.tokenServiceCustomClientId', event.target.value)}
            />
            <TextField
              variant='filled'
              fullWidth
              type="password"
              helperText='Never share your Client Secret!'
              value={settings.general.tokenServiceCustomClientSecret[0]}
              label='Client Secret'
              onChange={(event) => handleChange('general.tokenServiceCustomClientSecret', event.target.value)}
            />
          </Stack>
        </Collapse>

        <TextField
          variant='filled'
          multiline
          fullWidth
          value={settings.general.generalOwners[0].join('\n')}
          helperText={translate('one-record-per-line')}
          label={translate('core.oauth.settings.generalOwners')}
          onChange={(event) => handleChange('general.generalOwners', event.target.value.split('\n'))}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.bot')}</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <TextField
          variant='filled'
          fullWidth
          disabled
          value={settings.bot.botUsername[0]}
          label={translate('core.oauth.settings.botUsername')}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              { settings.bot.botUsername[0] !== ''
                ? <Button color="error" variant="contained" onClick={() => revoke('bot')}>Revoke</Button>
                : <Button color="success" variant="contained" onClick={() => authorize('bot')}>Authorize</Button>
              }
            </InputAdornment>,
          }}
        />
      </Stack>

      <Typography variant='body2' sx={{ p: 1 }}>Scopes:{' '}
        { settings.bot.botCurrentScopes[0].length === 0
          ? 'Unknown'
          : settings.bot.botCurrentScopes[0].sort().join(', ')}
      </Typography>
    </Paper>}

    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.channel')}</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <TextField
          variant='filled'
          fullWidth
          disabled
          value={settings.broadcaster.broadcasterUsername[0]}
          label={translate('core.oauth.settings.botUsername')}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              { settings.broadcaster.broadcasterUsername[0] !== ''
                ? <Button color="error" variant="contained" onClick={() => revoke('broadcaster')}>Revoke</Button>
                : <Button color="success" variant="contained" onClick={() => authorize('broadcaster')}>Authorize</Button>
              }
            </InputAdornment>,
          }}
        />
      </Stack>

      <Typography variant='body2' sx={{ p: 1 }}>Scopes:{' '}
        { settings.broadcaster.broadcasterCurrentScopes[0].length === 0
          ? 'Unknown'
          : settings.broadcaster.broadcasterCurrentScopes[0].sort().join(', ')}
      </Typography>
    </Paper>}

    <Typography variant='h2' sx={{ pb: 2 }}>{translate('categories.general')}</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <FormGroup sx={{ width: '100%' }}>
          <FormControlLabel
            control={<Checkbox onChange={(_, checked) => handleChange('general.createMarkerOnEvent', checked)}
              checked={settings.general.createMarkerOnEvent[0]} />}
            label={translate('core.twitch.settings.createMarkerOnEvent')} />
        </FormGroup>
        <FormGroup sx={{ width: '100%' }}>
          <FormControlLabel
            control={<Checkbox onChange={(_, checked) => handleChange('chat.sendWithMe', checked)}
              checked={settings.chat.sendWithMe[0]} />}
            label={translate('core.tmi.settings.sendWithMe')} />
        </FormGroup>
        <FormGroup sx={{ width: '100%' }}>
          <FormControlLabel
            control={<Checkbox onChange={(_, checked) => handleChange('chat.mute', checked)}
              checked={settings.chat.mute[0]} />}
            label={translate('core.tmi.settings.mute')} />
        </FormGroup>
        <FormGroup sx={{ width: '100%' }}>
          <FormControlLabel
            control={<Checkbox onChange={(_, checked) => handleChange('chat.whisperListener', checked)}
              checked={settings.chat.whisperListener[0]} />}
            label={translate('core.tmi.settings.whisperListener')} />
        </FormGroup>
        <FormGroup sx={{ width: '100%' }}>
          <FormControlLabel
            control={<Checkbox onChange={(_, checked) => handleChange('chat.showWithAt', checked)}
              checked={settings.chat.showWithAt[0]} />}
            label={translate('core.tmi.settings.showWithAt')} />
        </FormGroup>
        <FormGroup sx={{ width: '100%' }}>
          <FormControlLabel
            control={<Checkbox onChange={(_, checked) => handleChange('chat.sendAsReply', checked)}
              checked={settings.chat.sendAsReply[0]} />}
            label={translate('core.tmi.settings.sendAsReply')} />
        </FormGroup>

        <Grid container alignItems='center'>
          <Grid item>
            <Typography>{ translate('core.tmi.settings.ignorelist') }</Typography>
          </Grid>
          <Grid item sx={{ pl: 2 }}>
            <SettingsSystemsDialogStringArray title={translate('core.tmi.settings.ignorelist')} items={settings.chat.ignorelist[0]} onChange={(value) => handleChange('chat.ignorelist', value)} />
          </Grid>
        </Grid>
      </Stack>
    </Paper>}

    {server === 'https://demobot.sogebot.xyz'
      ? <Alert sx={{ width: '100%' }} severity="info">Save button removed in DEMO.</Alert>
      : <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" onClick={handleSave}>Save changes</LoadingButton>
      </Stack>}
  </Box>
  );
};
export default PageSettingsModulesServiceTwitch;
