import { jwtDecode } from 'jwt-decode';

import { baseURL } from './getBaseURL';

export const getUserLoggedIn = function() {
  return JSON.parse(localStorage.getItem('cached-logged-user') || 'null');
};

export const isUserLoggedIn = async function (mustBeLogged = true, mustBeAdmin = true): Promise<any | boolean | null> {
  if (sessionStorage.connectedToServer === 'false') {
    return false;
  }

  // check if we have auth code
  const user = JSON.parse(localStorage.getItem('cached-logged-user') || 'null');
  const accessToken = localStorage[`${localStorage.server}::accessToken`] || '';
  if (accessToken.trim().length === 0 || !user) {
    if (mustBeLogged) {
      console.log('Redirecting, user is not authenticated');
      sessionStorage.setItem('goto-after-login', location.href);
      if (window.location.href.includes('popout')) {
        window.location.assign(baseURL + '/credentials/login#error=popout+must+be+logged');
        return false;
      } else {
        window.location.assign(baseURL + '/credentials/login');
        return false;
      }
    } else {
      console.debug('User is not needed to be logged, returning null');
      return null;
    }
  } else {
    try {
      if (mustBeAdmin) {
        // check if user have dashboard:admin access
        const token = jwtDecode(localStorage.getItem(`${localStorage.server}::accessToken`) ?? '') as any;
        console.log('Scopes', JSON.stringify(token.privileges.scopes));
        if (token.privileges.haveAdminPrivileges || token.privileges.scopes.includes('dashboard:admin:read') || token.privileges.scopes.includes('dashboard:admin:manage')) {
          user.bot_scopes = {
            ...user.bot_scopes ?? {},
            [localStorage.server]: token.privileges.scopes
          };
          localStorage.setItem('cached-logged-user', JSON.stringify(user));
          return user;
        } else {
          throw new Error('User doesn\'t have access to this endpoint');
        }
      }
    } catch(e) {
      console.error(e);
      if (mustBeLogged) {
        if (e instanceof Error) {
          if (e.message && typeof e.message === 'string' && e.message.toLowerCase().includes('network error') && user) {
            console.warn('Network error, using cached logged user', user);
            return user;
          }
          if (e.message && typeof e.message === 'string' && e.message == 'User doesn\'t have access to this endpoint' && user) {
            console.error('Clearing tokens');
            delete localStorage[`${localStorage.server}::accessToken`];
            delete localStorage[`${localStorage.server}::refreshToken`];
            console.error(`Redirecting to ${baseURL}#error=access_denied`);
            window.location.assign(baseURL + '#error=access_denied');
            return;
          }
        }
        console.log('Redirecting, user code expired');
        if (window.location.href.includes('popout')) {
          console.error(`Redirecting to ${baseURL}/credentials/login#error=popout+must+be+logged`);
          window.location.assign(baseURL + '/credentials/login#error=popout+must+be+logged');
          return;
        } else {
          console.error(`Redirecting to ${baseURL}/credentials/login`);
          window.location.assign(baseURL + '/credentials/login');
          return;
        }
      }
    }
    return user;
  }
};
