import { Alert, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import { getSocket } from '../../helpers/socket';

const Streamlabs = () => {
  const [state, setState] = useState<boolean | null>(null);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if (server === 'https://demobot.sogebot.xyz') {
      return;
    }
    if (window.location.hash || window.location.search) {
      let code = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?code=') || url.startsWith('code=')) {
          code = url.replace(/\??code=/, '');
        }
      }

      if (code) {
        axios.get('https://credentials.sogebot.xyz/streamlabs/?code=' + code)
          .then(({ data }) => {
            const accessToken = data.access_token;
            getSocket('/integrations/streamlabs').emit('token', { accessToken }, () => {
              setState(true);
              setTimeout(() => window.close(), 1000);
              return;
            });
          })
          .catch(() => setState(false));
      } else {
        setState(false);
      }
    } else {
      location.href = `https://credentials.sogebot.xyz/streamlabs/`;
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

export default Streamlabs;
