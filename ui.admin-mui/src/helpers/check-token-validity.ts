// eslint-disable-next-line camelcase
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { debounce } from 'lodash';

const refreshToken = debounce(async () => {
  try {
    const token = localStorage[`${sessionStorage.server}::refreshToken`];
    if (token === '' || token === null) {
      return;
    }
    const validation = await axios.get(`${JSON.parse(sessionStorage.server)}/socket/refresh`, { headers: { 'x-twitch-token': token } });
    console.group('check-token-validity::refreshToken');
    console.debug('refreshToken', {
      refreshToken: token, validation,
    });
    console.groupEnd();
    localStorage[`${sessionStorage.server}::accessToken`] = validation.data.accessToken;
    localStorage[`${sessionStorage.server}::refreshToken`] = validation.data.refreshToken;
    localStorage[`${sessionStorage.server}::userType`] = validation.data.userType;
  } catch (e) {
    console.error(e);
    localStorage.removeItem(`${sessionStorage.server}::accessToken`);
    localStorage.removeItem(`${sessionStorage.server}::refreshToken`);
    localStorage.removeItem('code');
    localStorage.removeItem('clientId');
    localStorage[`${sessionStorage.server}::userType`] = 'unauthorized';
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
    if (localStorage[`${sessionStorage.server}::accessToken`]) {
      // we just need to check if token is expired
      const { exp } = jwt_decode<{exp: number}>(localStorage[`${sessionStorage.server}::accessToken`]);
      const expirationTime = (exp * 1000) - 60000;
      if (Date.now() >= expirationTime) {
        refreshToken();
      }
    }
  }, 1000);
}