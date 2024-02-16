import type { ClientToServerEventsWithNamespace, Fn } from '@sogebot/backend/d.ts/src/helpers/socket';
import axios from 'axios';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import { baseURL } from './getBaseURL';
import getAccessToken from '../getAccessToken';

export const redirectLogin = () => {
  if (window.location.href.includes('popout')) {
    window.location.assign(baseURL + '/credentials/login#error=popout+must+be+logged');
  } else {
    window.location.assign(baseURL + '/credentials/login');
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
    console.log('debug', JSON.stringify({
      stack:        new Error().stack,
      type:         'getSocket',
      namespace,
      continueOnUnauthorized,
      server:       localStorage.server,
      accessToken:  localStorage[`${localStorage.server}::accessToken`],
      refreshToken: localStorage[`${localStorage.server}::refreshToken`],
    }, undefined, 2));
  }

  let wsUrl = JSON.parse(localStorage.server).replace('https', '').replace('http', '');
  wsUrl = `${(JSON.parse(localStorage.server).startsWith('https') ? 'wss' : 'ws')}${wsUrl}`;

  const socket = io(wsUrl + (namespace as string), {
    transports: [ 'websocket' ],
    auth:       async (cb: (data: { token: string | null }) => void) => {
      // 1s wait if token is currently unavailable
      for (let i = 0; i < 10; i++) {
        const token = localStorage.getItem(`${localStorage.server}::accessToken`);
        if (token) {
          cb({ token: localStorage.getItem(`${localStorage.server}::accessToken`) });
          return;
        } else {
          if (continueOnUnauthorized) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      cb({ token: null });
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
      const refreshToken = localStorage[`${localStorage.server}::refreshToken`];
      if (refreshToken === '' || refreshToken === null) {
        // no refresh token -> unauthorize or force relogin
        localStorage.userType = 'unauthorized';
        if (!continueOnUnauthorized) {
          console.debug(window.location.href);
          redirectLogin();
        }
      } else {
        axios.get(`${JSON.parse(localStorage.server)}/socket/refresh`, { headers: { 'x-twitch-token': refreshToken } }).then(validation => {
          console.group('socket::validation');
          console.debug({
            validation, refreshToken,
          });
          console.groupEnd();
          localStorage[`${localStorage.server}::accessToken`] = validation.data.accessToken;
          localStorage[`${localStorage.server}::refreshToken`] = validation.data.refreshToken;
          localStorage[`${localStorage.server}::userType`] = validation.data.userType;
          // reconnect
          socket.disconnect();
          console.debug('Reconnecting with new token');
          socket.connect();
        }).catch((e) => {
          console.error(e);
          localStorage.removeItem(`${localStorage.server}::accessToken`);
          localStorage.removeItem(`${localStorage.server}::refreshToken`);
          localStorage.removeItem('code');
          localStorage.removeItem('clientId');
          localStorage[`${localStorage.server}::userType`] = 'unauthorized';
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
          localStorage[`${localStorage.server}::accessToken`] = '';
          location.reload();
        }
      }
    }
  });
  socket.on('forceDisconnect', () => {
    if (localStorage.getItem('userType') === 'viewer' || localStorage.getItem('userType') === 'admin') {
      console.debug('Forced disconnection from bot socket.');
      localStorage.removeItem(`${localStorage.server}::accessToken`);
      localStorage.removeItem(`${localStorage.server}::refreshToken`);
      localStorage.removeItem('code');
      localStorage.removeItem('clientId');
      localStorage[`${localStorage.server}::userType`] = 'unauthorized';
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
  const response = await axios.get(`/api/ui/configuration`, { headers: { authorization: `Bearer ${getAccessToken()}` } });
  return response.data;
};