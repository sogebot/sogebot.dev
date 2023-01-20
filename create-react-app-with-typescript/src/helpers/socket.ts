import type { ClientToServerEventsWithNamespace, Fn } from '@sogebot/backend/d.ts/src/helpers/socket';
import axios from 'axios';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export const redirectLogin = () => {
  if (window.location.href.includes('popout')) {
    window.location.assign(window.location.origin + '/credentials/login#error=popout+must+be+logged');
  } else {
    window.location.assign(window.location.origin + '/credentials/login');
  }
};

const authorizedSocket = new Map<string | number | symbol, any>();
const unauthorizedSocket = new Map<string | number | symbol, any>();

export function getSocket<K0 extends keyof O, O extends Record<PropertyKey, Record<PropertyKey, Fn>> = ClientToServerEventsWithNamespace> (namespace: K0, continueOnUnauthorized = false): Socket<O[K0]> {
  if (authorizedSocket.has(namespace)) {
    return authorizedSocket.get(namespace);
  }

  if (unauthorizedSocket.has(namespace) && continueOnUnauthorized) {
    return unauthorizedSocket.get(namespace);
  }

  if (localStorage.debug) {
    console.log('debug', {
      stack:         new Error().stack,
      type:          'getSocket',
      namespace,
      continueOnUnauthorized,
      currentServer: localStorage.currentServer,
      accessToken:   localStorage[`${localStorage.currentServer}::accessToken`],
      refreshToken:  localStorage[`${localStorage.currentServer}::refreshToken`],
    });
  }

  let wsUrl = JSON.parse(localStorage.server).replace('https', '').replace('http', '');
  wsUrl = `${(JSON.parse(localStorage.server).startsWith('https') ? 'wss' : 'ws')}${wsUrl}`;

  const socket = io(wsUrl + (namespace as string), {
    transports: [ 'websocket' ],
    auth:       (cb: (data: { token: string | null}) => void) => {
      cb({ token: localStorage.getItem(`${localStorage.currentServer}::accessToken`) });
    },
  }) as Socket;

  if (!continueOnUnauthorized) {
    authorizedSocket.set(namespace, socket);
  } else {
    unauthorizedSocket.set(namespace, socket);
  }

  socket.on('connect_error', (error: Error) => {
    if (error.message.includes('websocket error')) {
      // do nothing on connection error
      return;
    }
    console.error(error);
    if (!error.message.includes('malformed')
      && (error.message.includes('jwt expired') || (error.message.includes('JsonWebTokenError')))) {
      console.debug('Using refresh token to obtain new access token');
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken === '' || refreshToken === null) {
        // no refresh token -> unauthorize or force relogin
        localStorage.userType = 'unauthorized';
        if (!continueOnUnauthorized) {
          console.debug(window.location.href);
          redirectLogin();
        }
      } else {
        axios.get(`${process.env.isNuxtDev ? 'http://localhost:20000' : window.location.origin}/socket/refresh`, { headers: { 'x-twitch-token': refreshToken } }).then(validation => {
          console.group('socket::validation');
          console.debug({
            validation, refreshToken,
          });
          console.groupEnd();
          localStorage[`${localStorage.currentServer}::accessToken`] = validation.data.accessToken;
          localStorage[`${localStorage.currentServer}::refreshToken`] = validation.data.refreshToken;
          localStorage[`${localStorage.currentServer}::userType`] = validation.data.userType;
          // reconnect
          socket.disconnect();
          console.debug('Reconnecting with new token');
          socket.connect();
        }).catch((e) => {
          console.error(e);
          localStorage.removeItem(`${localStorage.currentServer}::accessToken`);
          localStorage.removeItem(`${localStorage.currentServer}::refreshToken`);
          localStorage.removeItem('code');
          localStorage.removeItem('clientId');
          localStorage[`${localStorage.currentServer}::userType`] = 'unauthorized';
          if (continueOnUnauthorized) {
            location.reload();
          } else {
            redirectLogin();
          }
        });
      }
    } else {
      if (error.message.includes('Invalid namespace')) {
        throw new Error(error.message + ' ' + (namespace as string));
      }
      if (!continueOnUnauthorized) {
        redirectLogin();
      } else {
        localStorage.userType = 'unauthorized';
        if (error.message.includes('malformed')) {
          localStorage[`${localStorage.currentServer}::accessToken`] = '';
          location.reload();
        }
      }
    }
  });
  socket.on('forceDisconnect', () => {
    if (localStorage.getItem('userType') === 'viewer' || localStorage.getItem('userType') === 'admin') {
      console.debug('Forced disconnection from bot socket.');
      localStorage.removeItem(`${localStorage.currentServer}::accessToken`);
      localStorage.removeItem(`${localStorage.currentServer}::refreshToken`);
      localStorage.removeItem('code');
      localStorage.removeItem('clientId');
      localStorage[`${localStorage.currentServer}::userType`] = 'unauthorized';
      if (continueOnUnauthorized) {
        location.reload();
      } else {
        redirectLogin();
      }
    }
  });
  return socket;
}

type Configuration = {
  [x:string]: Configuration | string;
};
export const getConfiguration = async (): Promise<Configuration> => {
  return new Promise<Configuration>((resolve, reject) => {
    getSocket('/core/ui', true).emit('configuration', (err, configuration) => {
      if (err) {
        return console.error(err);
      }
      if (process.env.IS_DEV) {
        console.groupCollapsed('GET=>Configuration');
        console.debug({ configuration });
        console.groupEnd();
      }
      if (configuration) {
        resolve(configuration);
      } else {
        reject();
      }
    });
  });
};