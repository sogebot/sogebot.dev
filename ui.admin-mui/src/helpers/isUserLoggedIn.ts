import { baseURL } from './getBaseURL';

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
        await new Promise<void>((resolve, reject) => {
          const check = () => {
            const userType = localStorage.getItem(`${localStorage.server}::userType`);
            if (!userType) {
              setTimeout(() => check(), 100);
            }

            if (userType) {
              if (userType === 'admin') {
                resolve();
              } else {
                reject('User doesn\'t have access to this endpoint');
              }
            }
          };
          check();
        });
      }
    } catch(e) {
      console.error(e);
      if (mustBeLogged) {
        if (e instanceof Error) {
          if (e.message && typeof e.message === 'string' && e.message.toLowerCase().includes('network error') && user) {
            console.warn('Network error, using cached logged user', user);
            return user;
          }
        }
        if (e === 'User doesn\'t have access to this endpoint') {
          window.location.assign(baseURL + '/credentials/login#error=must+be+caster');
        } else {
          console.log('Redirecting, user code expired');
          if (window.location.href.includes('popout')) {
            window.location.assign(baseURL + '/credentials/login#error=popout+must+be+logged');
          } else {
            window.location.assign(baseURL + '/credentials/login');
          }
        }
      }
    }
    return user;
  }
};
