import { Alert, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import { getSocket } from '../../helpers/socket';

const Google = () => {
  const [progress, setProgress] = useState<boolean | null>(null);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if (server === 'https://demobot.sogebot.xyz') {
      return;
    }
    if (window.location.hash || window.location.search) {
      let code = null;
      let state = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?code=') || url.startsWith('code=')) {
          code = url.replace(/\??code=/, '');
        }
        if (url.startsWith('?state=') || url.startsWith('state=')) {
          state = url.replace(/\??state=/, '');
        }
      }

      if (code) {
        if (!state || state !== localStorage.googleOauthState) {
          setProgress(false);
          return;
        }
        delete localStorage.googleOauthState;

        axios.get('https://credentials.sogebot.xyz/google/?code=' + code)
          .then(({ data }) => {
            const refreshToken = data.refresh_token;
            getSocket('/services/google').emit('google::token', { refreshToken }, () => {
              setProgress(true);
              setTimeout(() => window.close(), 1000);
              return;
            });
          })
          .catch(() => setProgress(false));
      } else {
        setProgress(false);
      }
    } else {
      localStorage.googleOauthState = nanoid();
      location.href = `https://credentials.sogebot.xyz/google/?state=${localStorage.googleOauthState}`;
    }
  }, [server]);

  return (<Backdrop open={true}>
    {server === 'https://demobot.sogebot.xyz'
      ? <Alert severity="error">OAuth service is disabled on DEMO.</Alert>
      : <Stack alignItems='center' spacing={1}>
        { progress === null && <CircularProgress/>}
        { progress === null && <Typography>Please wait, redirecting to oauth service.</Typography>}

        { progress === true && <Typography>Logged in, please wait.</Typography>}
        { progress === false && <Typography>Something went wrong, please close window and try again</Typography>}
      </Stack>}
  </Backdrop>);
};

export default Google;
