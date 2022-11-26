import {
  Backdrop, CircularProgress, Stack, Typography,
} from '@mui/material';
import axios from 'axios';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';

import { getSocket } from '~/src/helpers/socket';

const DonationAlerts: NextPage = () => {
  const [state, setState] = useState<boolean | null>(null);

  useEffect(() => {
    if (window.location.hash || window.location.search) {
      let code = null;
      let status = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?code=') || url.startsWith('code=')) {
          code = url.replace(/\??code=/, '');
        }
        if (url.startsWith('?status=') || url.startsWith('status=')) {
          status = url.replace(/\??status=/, '');
        }
      }

      if (code || status) {
        setState(true);
      }

      if (status) {
        // do nothing if we are done
        return;
      }

      if (code) {
        axios.get('https://credentials.sogebot.xyz/donationalerts/?code=' + code)
          .then(({ data }) => {
            const accessToken = data.access_token;
            const refreshToken = data.refresh_token;
            getSocket('/integrations/donationalerts').emit('donationalerts::token', {
              accessToken, refreshToken,
            }, () => {
              location.href = location.href + '&status=done';
              return;
            });
          })
          .catch(() => setState(false));
      } else {
        setState(false);
      }
    } else {
      location.href = `https://credentials.sogebot.xyz/donationalerts/`;
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

export default DonationAlerts;
