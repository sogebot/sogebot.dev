import { AnyAction, Dispatch } from '@reduxjs/toolkit';

import { setConnectedToServer, setMessage } from './store/loaderSlice';

function isBotStarted(dispatch: Dispatch<AnyAction>, server: string) {
  return new Promise(resolve => {
    const check = () => {
      dispatch(setMessage('Connecting to bot.'));
      console.log('Checking bot on ' + server);
      fetch(server)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.blob();
        }).then(() => {
          console.log('Bot is started, continue');
          dispatch(setConnectedToServer());
          localStorage.server = server;
          resolve(true);
        }).catch(() => {
          dispatch(setMessage('Cannot connect to bot.'));
        });
    };
    check();
  });
}

export { isBotStarted };