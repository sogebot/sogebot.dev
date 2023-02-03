// eslint-disable-next-line camelcase
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { debounce } from 'lodash';

const refreshToken = debounce(async () => {
  try {
    const token = localStorage.getItem('refreshToken');
    if (token === '' || token === null) {
      return;
    }
    const validation = await axios.get(`${process.env.isNuxtDev ? 'http://localhost:20000' : window.location.origin}/socket/refresh`, { headers: { 'x-twitch-token': token } });
    console.group('check-token-validity::refreshToken');
    console.debug('refreshToken', {
      refreshToken: token, validation,
    });
    console.groupEnd();
    localStorage[`${sessionStorage.currentServer}::accessToken`] = validation.data.accessToken;
    localStorage[`${sessionStorage.currentServer}::refreshToken`] = validation.data.refreshToken;
    localStorage[`${sessionStorage.currentServer}::userType`] = validation.data.userType;
  } catch (e) {
    console.error(e);
    localStorage.removeItem(`${sessionStorage.currentServer}::accessToken`);
    localStorage.removeItem(`${sessionStorage.currentServer}::refreshToken`);
    localStorage.removeItem('code');
    localStorage.removeItem('clientId');
    localStorage[`${sessionStorage.currentServer}::userType`] = 'unauthorized';
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

export default function accessTokenCheck () {
  setInterval(() => {
    if (localStorage[`${sessionStorage.currentServer}::accessToken`]) {
      // we just need to check if token is expired
      const { exp } = jwt_decode<{exp: number}>(localStorage[`${sessionStorage.currentServer}::accessToken`]);
      const expirationTime = (exp * 1000) - 60000;
      if (Date.now() >= expirationTime) {
        refreshToken();
      }
    }
  }, 1000);
}