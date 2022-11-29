import {
  Backdrop, CircularProgress, Stack, Typography,
} from '@mui/material';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';

import { getSocket } from '~/src/helpers/socket';

const Spotify: NextPage = () => {
  const [state, setState] = useState<boolean | null>(null);

  useEffect(() => {
    if (window.location.hash || window.location.search) {
      getSocket(`/integrations/spotify`).emit('spotify::state', (_err, spotifyState: any) => {
        let urlState = '';
        let urlCode = '';
        let status = null;
        for (const url of window.location.search.split('&')) {
          if (url.startsWith('?code=') || url.startsWith('code=')) {
            urlCode = url.replace(/\??code=/, '');
          }
          if (url.startsWith('?state=') || url.startsWith('state=')) {
            urlState = url.replace(/\??state=/, '');
          }
          if (url.startsWith('?status=') || url.startsWith('status=')) {
            status = url.replace(/\??status=/, '');
          }
        }

        if (status) {
          setState(true);
          return;
        }

        if (urlState === spotifyState) {
          console.log({urlState, spotifyState, urlCode})
          getSocket(`/integrations/spotify`).emit('spotify::code', urlCode, () => {
            location.href = location.href + '&status=done';
            setState(true);
          });
        } else {
          setState(false);
          console.error('State is not matching!');
        }
      });
    } else {
      getSocket(`/integrations/spotify`)
        .emit('spotify::authorize', (err, op: any) => {
          if (err) {
            return console.error(err);
          } else {
            // we need to replace redirectUri with dash uri
            const url = new URL(op.opts[0]);
            const params = new URLSearchParams(url.search);
            params.set('redirect_uri', 'https://dash.sogebot.xyz/credentials/spotify');
            window.location.href = `${url.origin}${url.pathname}?${params}`;
          }
        });
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

export default Spotify;
