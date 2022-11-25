import {
  Backdrop, CircularProgress, Stack, Typography,
} from '@mui/material';
import axios from 'axios';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';
import shortid from 'shortid';

import { getSocket } from '~/src/helpers/socket';

const serviceUrl = 'https://credentials.sogebot.xyz/twitch/';

const Twitch: NextPage = () => {
  const [progress, setProgress] = useState<boolean | null>(null);

  useEffect(() => {
    if (window.location.hash || window.location.search) {
      let type = null;
      let code = null;
      let status = null;
      let state = null;
      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?type=') || url.startsWith('type=')) {
          type = url.replace(/\??type=/, '');
        }
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

      if (type) {
        // redirect if we set type
        localStorage.twitchOauthState = type + shortid();
        location.href = `${serviceUrl}?state=${localStorage.twitchOauthState}`;
        return;
      }

      if (code || status) {
        setProgress(true);
      }

      if (status) {
        // do nothing if we are done
        return;
      }

      if (code) {
        if (!state || state !== localStorage.twitchOauthState) {
          console.error('Incorrect state');
          setProgress(false);
          return;
        }
        const accountType = state.startsWith('bot') ? 'bot' : 'broadcaster';
        delete localStorage.twitchOauthState;

        axios.get(serviceUrl + '?code=' + code)
          .then(({ data }) => {
            const refreshToken = data.refresh_token;
            const accessToken = data.access_token;
            getSocket('/services/twitch').emit('twitch::token', {
              accessToken,
              refreshToken,
              accountType,
            }, () => {
              location.href = location.href + '&status=done';
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
  }, []);

  return (<Backdrop open={true}>
    <Stack alignItems='center' spacing={1}>
      { progress === null && <CircularProgress/>}
      { progress === null && <Typography>Please wait, redirecting to oauth service.</Typography>}

      { progress === true && <Typography>Logged in, please wait.</Typography>}
      { progress === false && <Typography>Something went wrong, please close window and try again</Typography>}
    </Stack>
  </Backdrop>);
};

export default Twitch;
