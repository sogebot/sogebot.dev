/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Alert,
  Backdrop, CircularProgress, Stack, Typography,
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';
import shortid from 'shortid';

import { getSocket } from '../../helpers/socket';

const TwitchOwnAppTokens = () => {
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
      let clientId = null;
      let clientSecret = null;
      let scope = null;

      for (const url of window.location.search.split('&')) {
        if (url.startsWith('?type=') || url.startsWith('type=')) {
          type = url.replace(/\??type=/, '');
        }
        if (url.startsWith('?code=') || url.startsWith('code=')) {
          code = url.replace(/\??code=/, '');
        }
        if (url.startsWith('?state=') || url.startsWith('state=')) {
          state = url.replace(/\??state=/, '');
        }
        if (url.startsWith('?clientId=') || url.startsWith('clientId=')) {
          clientId = url.replace(/\??clientId=/, '');
        }
        if (url.startsWith('?clientSecret=') || url.startsWith('clientSecret=')) {
          clientSecret = url.replace(/\??clientSecret=/, '');
        }
        if (url.startsWith('?scope=') || url.startsWith('scope=')) {
          scope = url.replace(/\??scope=/, '');
        }
      }

      if (!code) {
        sessionStorage.twitchOauthState = type + shortid();
        sessionStorage.clientSecret = clientSecret;
        sessionStorage.clientId = clientId;
        location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${window.location.origin}/credentials/oauth/tokens&response_type=code&scope=${scope}&force_verify=true&state=${sessionStorage.twitchOauthState}`;
        return;
      }

      if (code) {
        if (!state || state !== sessionStorage.twitchOauthState) {
          console.error('Incorrect state');
          setProgress(false);
          return;
        }
        const accountType = state?.startsWith('bot') ? 'bot' : 'broadcaster';
        delete sessionStorage.twitchOauthState;

        axios.post(`https://id.twitch.tv/oauth2/token?client_id=${sessionStorage.clientId}&client_secret=${sessionStorage.clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${window.location.origin}/credentials/oauth/tokens`)
          .then(({ data }) => {
            const refreshToken = data.refresh_token;
            const accessToken = data.access_token;
            getSocket('/services/twitch').emit('twitch::token::ownApp', {
              accessToken,
              refreshToken,
              accountType,
              clientId:     sessionStorage.clientId,
              clientSecret: sessionStorage.clientSecret,
            }, () => {
              setProgress(true);
              setTimeout(() => window.close(), 1000);
              return;
            });
          })
          .catch((e) => {
            console.error(e);
            setProgress(false);
          })
          .finally(() => {
            delete sessionStorage.clientSecret;
            delete sessionStorage.clientId;
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

export default TwitchOwnAppTokens;
