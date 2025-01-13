import { Alert, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import getAccessToken from '../../getAccessToken';

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
          try {
            state = JSON.parse(window.atob(decodeURIComponent(url.replace(/\??state=/, ''))));

            // redirect to correct page with type, code or state if we have it
            if ((new URL(state.redirect_uri)).host !== window.location.host) {
              const params = new URLSearchParams();
              if (code) {
                params.append('code', code);
              }
              if (state) {
                params.append('state', window.btoa(JSON.stringify(state)));
              }
              window.location.href = `${state.redirect_uri}?${params.toString()}`;
              return;
            }
          } catch (e) {
            console.error('Error parsing state', e);
          }
        }
      }

      if (code) {
        if (!state || state.state !== JSON.parse(window.atob(localStorage.googleOauthState)).state) {
          setProgress(false);
          return;
        }
        delete localStorage.googleOauthState;

        axios.get('https://credentials.sogebot.xyz/google/?code=' + code)
          .then(({ data }) => {
            const refreshToken = data.refresh_token;
            axios.post(`${server}/api/services/google?_action=token`, { refreshToken }, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } }).then(() => {
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
      localStorage.twitchOauthState = window.btoa(JSON.stringify({
        state: nanoid(),
        redirect_uri: `${window.location.origin}/credentials/google`,
      }));
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
