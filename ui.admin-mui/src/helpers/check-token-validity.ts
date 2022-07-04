// eslint-disable-next-line camelcase
import jwt_decode from 'jwt-decode';
import { debounce } from 'lodash';
import axios from 'axios';

const refreshToken = debounce(async () => {
  try {
    const token = localStorage.getItem('refreshToken');
    if (token === '' || token === null) {
      return;
    }
    const validation = await axios.get(`${process.env.isNuxtDev ? 'http://localhost:20000' : window.location.origin}/socket/refresh`, { headers: { 'x-twitch-token': token } });
    console.group('check-token-validity::refreshToken');
    console.debug('refreshToken', { refreshToken: token, validation });
    console.groupEnd();
    localStorage.accessToken = validation.data.accessToken;
    localStorage.refreshToken = validation.data.refreshToken;
    localStorage.userType = validation.data.userType;
  } catch (e) {
    console.error(e);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('code');
    localStorage.removeItem('clientId');
    localStorage.userType = 'unauthorized';
    redirectLogin();
  }
}, 30000, { leading: true });

const redirectLogin = () => {
  if (window.location.href.includes('popout')) {
    window.location.assign(window.location.origin + '/credentials/login/#error=popout+must+be+logged');
  } else {
    window.location.assign(window.location.origin + '/credentials/login/');
  }
};

export default function () {
  setInterval(() => {
    if (localStorage.accessToken) {
      // we just need to check if token is expired
      const { exp } = jwt_decode<{exp: number}>(localStorage.accessToken);
      const expirationTime = (exp * 1000) - 60000;
      if (Date.now() >= expirationTime) {
        refreshToken();
      }
    }
  }, 1000);
}