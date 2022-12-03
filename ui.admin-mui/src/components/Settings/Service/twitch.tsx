import { Alert, LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Collapse  from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Select from '@mui/material/Select/Select';
import { SxProps, Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import capitalize from 'lodash/capitalize';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useEffect, useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import { useLocalstorageState, useRefElement } from 'rooks';

import { SettingsSystemsDialogStringArray } from '~/src/components/Settings/Dialog/StringArray';
import { getSocket } from '~/src/helpers/socket';
import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesServiceTwitch: React.FC<{
  onVisible: () => void,
  sx?: SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {
  const router = useRouter();
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/services/twitch');
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const handleSave = useCallback(async () => {
    // save settings
    save();
  }, [ save ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const redirectUri = useMemo(() => {
    return `${window.location.origin}/credentials/oauth/tokens`;
  }, []);

  const origin = useMemo(() => window.location.origin, []);

  const botUrl = useMemo(() => {
    if (!settings) {
      return '';
    }

    const scope = 'scope=channel:edit:commercial channel:moderate chat:edit chat:read clips:edit user:edit:broadcast user:read:broadcast whispers:edit whispers:read channel:manage:broadcast';
    const clientId = settings.general.tokenServiceCustomClientId[0];
    const clientSecret = settings.general.tokenServiceCustomClientSecret[0];

    if (settings.general.tokenService[0] === 'SogeBot Token Generator v2') {
      return null;
    } else {
      return `${redirectUri}?${scope}&clientId=${clientId}&clientSecret=${clientSecret}`;
    }
  }, [settings, redirectUri ]);

  const broadcasterUrl = useMemo(() => {
    if (!settings) {
      return '';
    }

    const scope = 'scope=channel:edit:commercial channel:moderate channel:read:hype_train channel:read:redemptions channel:read:subscriptions channel_editor chat:edit chat:read moderation:read user:read:broadcast channel:manage:broadcast user:edit:broadcast moderator:read:chatters';
    const clientId = settings.general.tokenServiceCustomClientId[0];
    const clientSecret = settings.general.tokenServiceCustomClientSecret[0];

    if (settings.general.tokenService[0] === 'SogeBot Token Generator v2') {
      return null;
    } else {
      return `${redirectUri}?${scope}&clientId=${clientId}&clientSecret=${clientSecret}`;
    }
  }, [settings, redirectUri ]);

  const revoke = useCallback((accountType: 'bot' | 'broadcaster') => {
    getSocket('/services/twitch').emit('twitch::revoke', { accountType }, () => {
      enqueueSnackbar('User access revoked.', { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh ]);

  const authorize = useCallback((accountType: 'bot' | 'broadcaster') => {
    const popup = window.open('/credentials/twitch/?type=' + accountType, 'popup', 'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no');
    const checkPopup = setInterval(() => {
      try {
        if (popup?.window.location.href.includes('status=done')) {
          popup.close();
        }
      } catch {
        // ignore cross origin error which may happen when google is authorizing
      }
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        setTimeout(() => refresh(), 5000);
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [ enqueueSnackbar, refresh ]);

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
      {!botUrl && <Stack spacing={1}>
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
      </Stack>}
      {botUrl && <>
        <Stack spacing={1}>
          <TextField
            variant='filled'
            fullWidth
            type='password'
            value={settings.bot.botAccessToken[0]}
            label={translate('core.oauth.settings.botAccessToken')}
            onChange={(event) => handleChange('bot.botAccessToken', event.target.value)}
          />
          <TextField
            variant='filled'
            fullWidth
            type='password'
            value={settings.bot.botRefreshToken[0]}
            label={translate('core.oauth.settings.botRefreshToken')}
            onChange={(event) => handleChange('bot.botRefreshToken', event.target.value)}
          />
          <TextField
            variant='filled'
            fullWidth
            disabled
            value={settings.bot.botUsername[0]}
            label={translate('core.oauth.settings.botUsername')}
            onChange={(event) => handleChange('bot.botUsername', event.target.value)}
          />
        </Stack>
        <Button sx={{ m: 0.5 }} href={botUrl} target='_blank'>{ translate('commons.generate') }</Button>
      </>}
    </Paper>}

    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.channel')}</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      {!broadcasterUrl && <Stack spacing={1}>
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
      </Stack>}
      {broadcasterUrl && <>
        <Stack spacing={1}>
          <TextField
            variant='filled'
            fullWidth
            type='password'
            value={settings.broadcaster.broadcasterAccessToken[0]}
            label={translate('core.oauth.settings.botAccessToken')}
            onChange={(event) => handleChange('broadcaster.broadcasterAccessToken', event.target.value)}
          />
          <TextField
            variant='filled'
            fullWidth
            type='password'
            value={settings.broadcaster.broadcasterRefreshToken[0]}
            label={translate('core.oauth.settings.botRefreshToken')}
            onChange={(event) => handleChange('broadcaster.broadcasterRefreshToken', event.target.value)}
          />
          <TextField
            variant='filled'
            fullWidth
            disabled
            value={settings.broadcaster.broadcasterUsername[0]}
            label={translate('core.oauth.settings.botUsername')}
            onChange={(event) => handleChange('broadcaster.broadcasterUsername', event.target.value)}
          />
        </Stack>
        <Button sx={{ m: 0.5 }} href={broadcasterUrl} target='_blank'>{ translate('commons.generate') }</Button>
      </>}
    </Paper>}

    <Typography variant='h2' sx={{ pb: 2 }}>{translate('categories.eventsub')}</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <Alert severity="info" icon={false}>
        For use of EventSub you need to have SSL enabled domain and created Twitch App
          <ol>
            <li>Go to <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noreferrer">https://dev.twitch.tv/console/apps</a>{' '}
            and register your app</li>
            <li>You can choose any <strong>name</strong> of app you want</li>
            <li>Set <strong>oauth redirect</strong> to your { origin }/credentials/oauth/eventsub</li>
            <li>Pick Application Integration for <strong>category</strong> and create</li>
            <li>After creation copy clientId and generate clientSecret</li>
            <li>Authorize your broadcaster account to enable subscription with your account</li>
          </ol>
        </Alert>

        <TextField
          variant='filled'
          fullWidth
          value={settings.eventsub.eventSubClientId[0]}
          label={capitalize(translate('integrations.spotify.settings.clientId'))}
          onChange={(event) => handleChange('eventsub.eventSubClientId', event.target.value)}
        />

        <TextField
          variant='filled'
          fullWidth
          type='password'
          value={settings.eventsub.eventSubClientSecret[0]}
          label={translate('integrations.spotify.settings.clientSecret')}
          onChange={(event) => handleChange('eventsub.eventSubClientSecret', event.target.value)}
        />

        <Stack direction='row' spacing={1} alignItems='center'>
          <FormGroup sx={{ width: '100%' }}>
            <FormControlLabel control={<Checkbox onChange={(_, checked) => handleChange('eventsub.useTunneling', checked)}checked={settings.eventsub.useTunneling[0]} />} label="Use unreliable tunneling (works on localhost)" />
          </FormGroup>
          <TextField
            variant='filled'
            fullWidth
            helperText={translate('core.ui.settings.domain.help')}
            value={settings.eventsub.domain[0]}
            disabled={settings.eventsub.useTunneling[0]}
            label={translate('core.ui.settings.domain.title')}
            onChange={(event) => handleChange('eventsub.domain', event.target.value)}
          />
        </Stack>

        <Alert severity="info" icon={false}>Authorize by clicking on authorize button. It will then take around ~1
        minute to subscribe to missing events</Alert>
        <Typography variant='h6' sx={{ pb: 2 }}>Currently subscribed events</Typography>
        <List dense>
          {settings.eventsub.eventSubEnabledSubscriptions[0].map((item: string) => <ListItem key={item}>
            {item}
          </ListItem>)}
        </List>
      </Stack>
      <Button sx={{ m: 0.5 }} href={`https://id.twitch.tv/oauth2/authorize?client_id=${settings.eventsub.eventSubClientId[0]}&redirect_uri=${origin}/credentials/oauth/eventsub&response_type=token&force_verify=true&scope=channel:read:hype_train channel:read:polls channel:manage:polls channel:manage:predictions`} target='_blank'>{ translate('commons.generate') }</Button>
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
            control={<Checkbox onChange={(_, checked) => handleChange('general.isTitleForced', checked)}
              checked={settings.general.isTitleForced[0]} />}
            label={translate('core.twitch.settings.isTitleForced')} />
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

    {server !== 'https://demobot.sogebot.xyz' && <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" onClick={handleSave}>Save changes</LoadingButton>
    </Stack>}
  </Box>
  );
};
export default PageSettingsModulesServiceTwitch;
