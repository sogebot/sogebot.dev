import { CloseTwoTone } from '@mui/icons-material';
import { Button, IconButton, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect } from 'react';
import { useLocalstorageState } from 'rooks';

import { baseURL } from '../helpers/getBaseURL';
import { useAppSelector } from '../hooks/useAppDispatch';
import { useScope } from '../hooks/useScope';
import { useSettings } from '../hooks/useSettings';

export const OnboardingTokens: React.FC = () => {
  const scope = useScope('dashboard');

  if (!scope.manage) {
    // do nothing if user is not admin
    return <></>;
  }

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const { connectedToServer } = useAppSelector((s: any) => s.loader);
  const { settings, refresh } = useSettings('/services/twitch');

  useEffect(() => {
    if (settings) {
      if (server !== 'https://demobot.sogebot.xyz') {
        if (settings.broadcaster.broadcasterRefreshToken[0].length === 0) {
          const notif = enqueueSnackbar('Broadcaster account not authorized', {
            action: <Stack direction='row'>
              <Button variant="contained" sx={{
                color: 'black',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: '#aaa',
                },
              }} onClick={() => authorize('broadcaster')}>Authorize broadcaster account</Button>
              <IconButton color='light' onClick={() => closeSnackbar(notif)} sx={{ color: 'white' }}>
                <CloseTwoTone/>
              </IconButton>
            </Stack>,
            variant: 'error',
            autoHideDuration: null,
          });
        }
        if (settings.bot.botRefreshToken[0].length === 0) {
          const notif = enqueueSnackbar('Bot account not authorized', {
            action: <Stack direction='row'>
              <Button variant="contained" sx={{
                color: 'black',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: '#aaa',
                },
              }} onClick={() => authorize('bot')}>Authorize bot account</Button>
              <IconButton color='light' onClick={() => closeSnackbar(notif)} sx={{ color: 'white' }}>
                <CloseTwoTone/>
              </IconButton>
            </Stack>,
            variant: 'error',
            autoHideDuration: null,
          });
        }
      }
    }
  }, [ settings, connectedToServer, server ]);

  useEffect(() => {
    if (connectedToServer) {
      refresh();
    }
  }, [connectedToServer]);

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

  return <></>;
};