import {
  Alert,
  Backdrop, CircularProgress, Stack, Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import { getSocket } from '../../helpers/socket';

const Tiltify = () => {
  const [state, setState] = useState<boolean | null>(null);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if (server === 'https://demobot.sogebot.xyz') {
      return;
    }
    if (window.location.hash || window.location.search) {
      let urlCode = null;
      let status = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?token=') || url.startsWith('token=')) {
          urlCode = url.replace(/\??token=/, '');
        }
        if (url.startsWith('?status=') || url.startsWith('status=')) {
          status = url.replace(/\??status=/, '');
        }
      }

      if (urlCode || status) {
        setState(true);
      }

      if (urlCode) {
        getSocket('/integrations/tiltify').emit('tiltify::code', urlCode, () => {
          location.href = location.href + '&status=done';
          return;
        });
      } else {
        setState(false);
      }
    } else {
      location.href = `https://tiltify.soge.workers.dev/authorize?state=${Buffer.from(JSON.stringify({
        server:   JSON.parse(localStorage.server),
        referrer: window.location.origin,
        version:  2,
      })).toString('base64')}`;
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
