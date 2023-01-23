import { Backdrop, CircularProgress } from '@mui/material';
import axios from 'axios';
import get from 'lodash/get';
import React from 'react';
import { useDidMount } from 'rooks';

const OAuth = () => {
  useDidMount(async () => {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = JSON.parse(window.atob(url.searchParams.get('state') ?? ''));

      // goto after login
      const gotoAfterLogin = sessionStorage.getItem('goto-after-login');
      sessionStorage.removeItem('goto-after-login');

      console.group('oauth::onMounted');
      console.debug(JSON.stringify({
        url, code, state, gotoAfterLogin,
      }));
      console.groupEnd();

      // set it as new authorization
      for (const key of Object.keys(localStorage)) {
        if (key.includes('::accessToken') || key.includes('::refreshToken')) {
          localStorage.removeItem(key);
        }
      }

      if (!code) {
        throw new Error('Missing code!');
      }

      const twitchHeaders = { headers: { Authorization: 'Bearer ' + code } };
      const twitchValidation = await axios.get<any>('https://id.twitch.tv/oauth2/validate', twitchHeaders);
      console.group('isUserLoggedIn::twitch::validation');
      console.debug(JSON.stringify({
        twitchValidation, twitchHeaders,
      }));
      console.groupEnd();
      localStorage.userId = twitchValidation.data.user_id;
      localStorage.clientId = twitchValidation.data.client_id;
      localStorage.code = code;
      console.log(`Logged as ${twitchValidation.data.login}#${twitchValidation.data.user_id}`);

      const axiosData = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
          Authorization: 'Bearer ' + code,
          'Client-Id':   twitchValidation.data.client_id,
        },
      });
      const data = get(axiosData, 'data.data[0]', null);
      if (data === null) {
        localStorage.removeItem('userId');
        throw new Error('User must be logged');
      }
      console.group('isUserLoggedIn::twitch::cached-logged-user');
      console.debug(JSON.stringify(data));
      console.groupEnd();
      localStorage['cached-logged-user'] = JSON.stringify(data);

      window.location.assign(`${gotoAfterLogin || state.referrer || state.url}`);
    } catch (error) {
      console.error({ error });
      localStorage.removeItem('twitchLoggedUser');
      window.location.assign(window.location.origin + '/credentials/login');
    }
  });
  return (<Backdrop open={true}><CircularProgress/></Backdrop>);
};

export default OAuth;
