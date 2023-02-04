import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIntervalWhen, useSessionstorageState } from 'rooks';

import { getSocket } from '../helpers/socket';
import { useSettings } from '../hooks/useSettings';
import { setTokensOnboardingState } from '../store/loaderSlice';

export const OnboardingTokens: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [server] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');
  const { connectedToServer } = useSelector((s: any) => s.loader);
  const { settings, refresh } = useSettings('/services/twitch');

  useEffect(() => {
    if (settings) {
      if (server === 'https://demobot.sogebot.xyz' || (settings.bot.botAccessToken[0].length > 0 && settings.broadcaster.broadcasterAccessToken[0].length > 0)) {
        dispatch(setTokensOnboardingState(true));
        setOpen(false);
      } else {
        setOpen(true);
      }
    }
  }, [ dispatch, settings, connectedToServer, server ]);

  const handleContinue = useCallback(() => {
    dispatch(setTokensOnboardingState(true));
    setOpen(false);
  }, [dispatch]);

  useEffect(() => {
    if (connectedToServer) {
      refresh();
    }
  }, [refresh, location.pathname, connectedToServer]);

  const [open, setOpen] = React.useState(false);

  const handleServerLogout = () => {
    delete localStorage.serverAutoConnect;
    navigate('/');
    window.location.reload();
  };

  useIntervalWhen(refresh, 1000, open, true);

  const revoke = useCallback((accountType: 'bot' | 'broadcaster') => {
    getSocket('/services/twitch').emit('twitch::revoke', { accountType }, () => {
      enqueueSnackbar('User access revoked.', { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh ]);

  const authorize = useCallback((accountType: 'bot' | 'broadcaster') => {
    const popup = window.open('/credentials/twitch/?type=' + accountType, 'popup', 'popup=true,width=400,height=300,toolbar=no,location=no,status=no,menubar=no');
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
    <DialogContent>
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
    <DialogActions sx={{ justifyContent: 'space-between' }}>
    </DialogActions>
    <DialogActions>
      <Button variant='contained' onClick={handleContinue}>Continue</Button>
      <Button color="error" variant='contained' onClick={handleServerLogout}>Leave server</Button>
    </DialogActions>
  </Dialog>);
};