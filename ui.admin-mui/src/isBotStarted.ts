import { AnyAction, Dispatch } from '@reduxjs/toolkit';

import { setConnectedToServer, setMessage } from './store/loaderSlice';

function isBotStarted(dispatch: Dispatch<AnyAction>, server: string) {
  return new Promise(resolve => {
    const check = () => {
      dispatch(setMessage('Checking bot status.'));
      console.log('Checking bot on ' + server);
      fetch(server)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.blob();
        }).then(() => {
          console.log('Bot is started, continue');
          localStorage.server = JSON.stringify(server);
          setTimeout(() => {
            dispatch(setConnectedToServer());
          }, 100);
          resolve(true);
        }).catch(() => {
          dispatch(setMessage('Cannot connect to bot.'));
        });
    };
    check();
  });
}

export { isBotStarted };