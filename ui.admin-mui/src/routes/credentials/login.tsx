import { Backdrop, CircularProgress } from '@mui/material';
import React from 'react';
import { useDidMount } from 'rooks';

const Login = () => {
  useDidMount(() => {
    const scopes = [
      'user:edit',
      'user:read:email',
      'moderator:read:followers',
      'channel:read:redemptions',
      'bits:read',
      'channel:moderate',
    ];
    const clientId = '25ptx7puxva3gg1lt557qjp1ii0uur';
    const state = encodeURIComponent(window.btoa(
      JSON.stringify({
        url:      window.location.origin,
        version:  2,
        referrer: document.referrer,
      }),
    ));
    window.location.assign(`https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=http://oauth.sogebot.xyz/&response_type=token&scope=${scopes.join('+')}&state=${state}&force_verify=true`);
  });
  return (<Backdrop open={true}><CircularProgress/></Backdrop>);
};

export default Login;