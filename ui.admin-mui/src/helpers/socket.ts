import axios from 'axios';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import { baseURL } from './getBaseURL';
import getAccessToken from '../getAccessToken';

export const redirectLogin = () => {
  if (window.location.href.includes('popout')) {
    window.location.assign(baseURL + '/credentials/login#error=popout+must+be+logged');
  } else {
    console.error('Forced disconnection from bot socket.');
    window.location.assign(baseURL + '/');
  }
};

const _socket = new Map<string | number | symbol, any>();

export function getSocket(namespace: string): Socket {
  if (_socket.has(namespace)) {
    return _socket.get(namespace);
  }

  if (localStorage.debug) {
    console.log('debug', JSON.stringify({
      stack:        new Error().stack,
      type:         'getSocket',
      namespace,
      server:       localStorage.server,
      accessToken:  localStorage[`${localStorage.server}::accessToken`],
      refreshToken: localStorage[`${localStorage.server}::refreshToken`],
    }, undefined, 2));
  }

  let wsUrl = JSON.parse(localStorage.server).replace('https', '').replace('http', '');
  wsUrl = `${(JSON.parse(localStorage.server).startsWith('https') ? 'wss' : 'ws')}${wsUrl}`;

  const socket = io(wsUrl + (namespace as string), {
    transports: [ 'websocket' ],
  }) as Socket;

  _socket.set(namespace, socket);

  socket.on('connect_error', (error: Error) => {
    if (error.message.includes('websocket error')) {
      // do nothing on connection error
      return;
    }
    console.error(error);
  });
  socket.on('forceDisconnect', () => {
    if (localStorage.getItem('userType') === 'viewer' || localStorage.getItem('userType') === 'admin') {
      console.debug('Forced disconnection from bot socket.');
      localStorage.removeItem(`${localStorage.server}::accessToken`);
      localStorage.removeItem(`${localStorage.server}::refreshToken`);
      localStorage.removeItem('code');
      localStorage.removeItem('clientId');
      localStorage[`${localStorage.server}::userType`] = 'unauthorized';
      redirectLogin();
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