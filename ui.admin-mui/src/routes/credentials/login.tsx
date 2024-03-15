import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import React from 'react';

import { baseURL } from '../../helpers/getBaseURL';
import theme from '../../theme';

export const scopes = [
  'user:edit',
  'user:read:email',
  'moderator:read:followers',
  'channel:read:redemptions',
  'bits:read',
  'channel:moderate',
  'channel:read:predictions',
  'channel:read:polls',
  'channel:read:hype_train',
  'channel:read:charity',
  'channel:read:goals',
  'moderator:read:shield_mode',
  'moderator:read:shoutouts',
  'channel:read:ads',
];

let error: string | null = null;
const Login = () => {
  if (window.location) {
    const hash = window.location.hash;
    error = hash.replace('#error=', '');
    if (error.trim().length === 0) {
      error = null;
    }
  }
  React.useEffect(() => {
    error && console.error(error);
    const clientId = '25ptx7puxva3gg1lt557qjp1ii0uur';
    const state = encodeURIComponent(window.btoa(
      JSON.stringify({
        url:      baseURL,
        version:  2,
        referrer: document.referrer,
      }),
    ));
    setTimeout(() => {
      window.location.assign(`https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=http://oauth.sogebot.xyz/&response_type=token&scope=${scopes.join('+')}&state=${state}&force_verify=true`);
    }, error !== null ? 3000 : 0);
  }, []);
  return (<Backdrop open={true}>
    <Stack alignItems='center' spacing={1}>
      <CircularProgress/>
      {error && <Typography color={theme.palette.error.main}>Error: {error}.</Typography>}
      {error && <Typography>Redirecting to Twitch Authentication.</Typography>}
    </Stack>
  </Backdrop>);
};

export default Login;