import { Alert, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import getAccessToken from '../../getAccessToken';

const Spotify = () => {
  const [state, setState] = useState<boolean | null>(null);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if (server === 'https://demobot.sogebot.xyz') {
      return;
    }
    if (window.location.hash || window.location.search) {
      axios.post(`${server}/api/integrations/spotify?_action=state`, undefined, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          let urlState = '';
          let urlCode = '';
          for (const url of window.location.search.split('&')) {
            if (url.startsWith('?code=') || url.startsWith('code=')) {
              urlCode = url.replace(/\??code=/, '');
            }
            if (url.startsWith('?state=') || url.startsWith('state=')) {
              urlState = url.replace(/\??state=/, '');
            }
          }

          if (urlState === data.data) {
            axios.post(`${server}/api/integrations/spotify?_action=code`, { code: urlCode }, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } })
              .then(() => {
                setState(true);
                setTimeout(() => window.close(), 1000);
              });
          } else {
            setState(false);
            console.error('State is not matching!');
          }
        });
    } else {
      axios.post(`${server}/api/integrations/spotify?_action=authorize`, undefined, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          const { opts } = data.data;
          const url = new URL(opts[0]);
          const params = new URLSearchParams(url.search);
          params.set('redirect_uri', 'https://dash.sogebot.xyz/credentials/spotify');
          window.location.href = `${url.origin}${url.pathname}?${params}`;
        })
        .catch(e => console.error(e.response.data));
    }
  }, [server]);

  return (<Backdrop open={true}>
    {server === 'https://demobot.sogebot.xyz'
      ? <Alert severity="error">OAuth service is disabled on DEMO.</Alert>
      : <Stack alignItems='center' spacing={1}>
        { state === null && <CircularProgress/>}
        { state === null && <Typography>Please wait, redirecting to oauth service.</Typography>}

        { state === true && <Typography>Logged in, please wait.</Typography>}
        { state === false && <Typography>Something went wrong, please close window and try again</Typography>}
      </Stack>}
  </Backdrop>);
};

export default Spotify;
