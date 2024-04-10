import { Alert, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import getAccessToken from '../../getAccessToken';
import { baseURL } from '../../helpers/getBaseURL';

const Tiltify = () => {
  const [state, setState] = useState<boolean | null>(null);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if (server === 'https://demobot.sogebot.xyz') {
      return;
    }
    if (window.location.hash || window.location.search) {
      let urlCode = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?token=') || url.startsWith('token=')) {
          urlCode = url.replace(/\??token=/, '');
        }
      }

      if (urlCode) {
        axios.post(`${server}/api/integrations/tiltify/?_action=code`, { code: urlCode }, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(() => {
            setState(true);
            setTimeout(() => window.close(), 1000);
            return;
          })
          .catch(() => {
            console.error('Failed to save tiltify credentials');
            setState(false);
          });
      } else {
        setState(false);
      }
    } else {
      location.href = `https://tiltify.soge.workers.dev/authorize?state=${window.btoa(JSON.stringify({
        server:   JSON.parse(localStorage.server),
        referrer: baseURL,
        version:  2,
      }))}`;
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

export default Tiltify;
