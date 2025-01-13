import { decode } from 'punycode';

import { Alert, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import getAccessToken from '../../getAccessToken';

const serviceUrl = 'https://credentials.sogebot.xyz/twitch/';

const Twitch = () => {
  const [progress, setProgress] = useState<boolean | null>(null);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if (server === 'https://demobot.sogebot.xyz') {
      return;
    }

    if (window.location.hash || window.location.search) {
      let type = null;
      let code = null;
      let state = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?type=') || url.startsWith('type=')) {
          type = url.replace(/\??type=/, '');
        }
        if (url.startsWith('?code=') || url.startsWith('code=')) {
          code = url.replace(/\??code=/, '');
        }
        if (url.startsWith('?state=') || url.startsWith('state=')) {
          try {
            state = JSON.parse(window.atob(decodeURIComponent(url.replace(/\??state=/, ''))));

            // redirect to correct page with type, code or state if we have it
            if (state.redirect_uri !== window.location.href) {
              const params = new URLSearchParams();
              if (type) {
                params.append('type', type);
              }
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

      if (type) {
        // redirect if we set type
        localStorage.twitchOauthState = window.btoa(JSON.stringify({
          type: type,
          state: nanoid(),
          redirect_uri: window.location.href,
        }));
        location.href = `${serviceUrl}?state=${localStorage.twitchOauthState}`;
        return;
      }

      if (code) {

        if (!state || state.state !== JSON.parse(window.atob(localStorage.twitchOauthState)).state) {
          console.error('Incorrect state');
          setProgress(false);
          return;
        }
        const accountType = state.type;
        delete localStorage.twitchOauthState;

        axios.get(serviceUrl + '?code=' + code)
          .then(({ data }) => {
            const refreshToken = data.refresh_token;
            axios.post(`${server}/api/services/twitch/?_action=token`, { refreshToken, accountType }, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } }).then(() => {
              setProgress(true);
              setTimeout(() => window.close(), 1000);
              return;
            });
          })
          .catch((e) => {
            console.error(e);
            setProgress(false);
          });
      } else {
        setProgress(false);
      }
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

export default Twitch;
