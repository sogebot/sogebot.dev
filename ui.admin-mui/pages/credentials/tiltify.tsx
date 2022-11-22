import {
  Backdrop, CircularProgress, Stack, Typography,
} from '@mui/material';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';

import { getSocket } from '~/src/helpers/socket';

const Tiltify: NextPage = () => {
  const [state, setState] = useState<boolean | null>(null);

  useEffect(() => {
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
        server:   localStorage.server,
        referrer: window.location.origin,
        version:  2,
      })).toString('base64')}`;
    }
  }, []);

  return (<Backdrop open={true}>
    <Stack alignItems='center' spacing={1}>
      { state === null && <CircularProgress/>}
      { state === null && <Typography>Please wait, redirecting to oauth service.</Typography>}

      { state === true && <Typography>Logged in, please wait.</Typography>}
      { state === false && <Typography>Something went wrong, please close window and try again</Typography>}
    </Stack>
  </Backdrop>);
};

export default Tiltify;
