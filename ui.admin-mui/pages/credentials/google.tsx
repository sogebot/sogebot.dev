import {
  Alert,
  Backdrop, CircularProgress, Stack, Typography,
} from '@mui/material';
import axios from 'axios';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';
import shortid from 'shortid';

import { getSocket } from '~/src/helpers/socket';

const Google: NextPage = () => {
  const [progress, setProgress] = useState<boolean | null>(null);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if (server === 'https://demobot.sogebot.xyz') {
      return;
    }
    if (window.location.hash || window.location.search) {
      let code = null;
      let status = null;
      let state = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?code=') || url.startsWith('code=')) {
          code = url.replace(/\??code=/, '');
        }
        if (url.startsWith('?status=') || url.startsWith('status=')) {
          status = url.replace(/\??status=/, '');
        }
        if (url.startsWith('?state=') || url.startsWith('state=')) {
          state = url.replace(/\??state=/, '');
        }
      }

      if (code || status) {
        setProgress(true);
      }

      if (status) {
        // do nothing if we are done
        return;
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
              location.href = location.href + '&status=done';
              return;
            });
          })
          .catch(() => setProgress(false));
      } else {
        setProgress(false);
      }
    } else {
      localStorage.googleOauthState = shortid();
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
