import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIntervalWhen, useLocalstorageState } from 'rooks';

import { onboardingTokensAtomValid } from '../atoms';
import getAccessToken from '../getAccessToken';
import { baseURL } from '../helpers/getBaseURL';
import { useAppSelector } from '../hooks/useAppDispatch';
import { useScope } from '../hooks/useScope';
import { useSettings } from '../hooks/useSettings';

export const OnboardingTokens: React.FC = () => {
  const scope = useScope('dashboard');

  const setTokensOnboardingState = useSetAtom(onboardingTokensAtomValid);

  if (!scope.manage) {
    // do nothing if user is not admin
    setTokensOnboardingState(true);
    return <></>;
  }

  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const { connectedToServer } = useAppSelector((s: any) => s.loader);
  const { settings, refresh } = useSettings('/services/twitch');

  useEffect(() => {
    if (settings) {
      if (server !== 'https://demobot.sogebot.xyz' && (settings.bot.botRefreshToken[0].length > 0 || settings.broadcaster.broadcasterRefreshToken[0].length > 0)) {
        setTokensOnboardingState(true);
        setOpen(false);
      } else {
        setOpen(true);
      }
    }
  }, [ settings, connectedToServer, server ]);

  const handleContinue = () => {
    setTokensOnboardingState(true);
    setOpen(false);
  };

  useEffect(() => {
    if (connectedToServer) {
      refresh();
    }
  }, [location.pathname, connectedToServer]);

  const [open, setOpen] = React.useState(false);

  const handleServerLogout = () => {
    delete localStorage.serverAutoConnect;
    navigate('/');
    window.location.reload();
  };

  useIntervalWhen(refresh, 1000, open, true);

  const revoke = useCallback((accountType: 'bot' | 'broadcaster') => {
    axios.post(`/api/services/twitch/?_action=revoke`, { accountType }, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } }).then(() => {
      enqueueSnackbar('User Access revoked.', { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh ]);

  const authorize = useCallback((accountType: 'bot' | 'broadcaster') => {
    const popup = window.open(baseURL + '/credentials/twitch/?type=' + accountType, 'popup', 'popup=true,width=400,height=300,toolbar=no,location=no,status=no,menubar=no');
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [ enqueueSnackbar ]);

  return (<Dialog open={open}>
    <DialogTitle>
      Some accounts are not connected to Twitch on this server
    </DialogTitle>
    <DialogContent dividers>
      <Alert variant='standard' severity='info'>To continue, please authorize your accounts. You need to have different accounts for bot and broadcaster.</Alert>
      {settings && <>
        <Stack sx={{
          pt: 2, height: '50px', alignItems: 'center',
        }} spacing={1} direction='row'>
          <Typography>
            <strong>Bot account:</strong> {settings.bot.botUsername[0].length > 0
              ? `${settings.bot.botUsername[0]}#${settings.bot.botId[0]}`
              : 'Not authorized'}
          </Typography>
          { settings.bot.botUsername[0] !== ''
            ? <Button color="error" variant="contained" onClick={() => revoke('bot')}>Revoke</Button>
            : <Button color="success" variant="contained" onClick={() => authorize('bot')}>Authorize</Button>
          }
        </Stack>
        <Stack sx={{
          pt: 2, height: '50px', alignItems: 'center',
        }} spacing={1} direction='row'>
          <Typography>
            <strong>Broadcaster account:</strong> {settings.broadcaster.broadcasterUsername[0].length > 0
              ? `${settings.broadcaster.broadcasterUsername[0]}#${settings.broadcaster.broadcasterId[0]}`
              : 'Not authorized'}
          </Typography>
          { settings.broadcaster.broadcasterUsername[0] !== ''
            ? <Button color="error" variant="contained" onClick={() => revoke('broadcaster')}>Revoke</Button>
            : <Button color="success" variant="contained" onClick={() => authorize('broadcaster')}>Authorize</Button>
          }
        </Stack>
      </>
      }
    </DialogContent>
    <DialogActions>
      <Button variant='contained' onClick={handleContinue}>Continue</Button>
      <Button color="error" variant='contained' onClick={handleServerLogout}>Leave server</Button>
    </DialogActions>
  </Dialog>);
};