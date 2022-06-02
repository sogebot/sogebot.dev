import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import { setMessage, setState } from './store/loaderSlice'

let waitAfterStart = false;

const url = process && process.env.NODE_ENV === 'development' ? 'http://localhost:20000/health' : '/health';

function isBotStarted(dispatch: Dispatch<AnyAction>) {
  dispatch(setState(false));
  return new Promise(resolve => {
    const check = () => {
      dispatch(setMessage('Connecting to bot.'));
      console.log('Checking bot on ' + url);
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.blob();
        }).then(() => {
          if (!waitAfterStart) {
            console.log('Bot is started, continue');
            dispatch(setState(true))
            resolve(true);
          } else {
            dispatch(setMessage('... registering sockets ...'));
            console.log('Bot is started, registering sockets');
            setTimeout(() => {
              console.log('Bot is started, waiting to full bot load');
              dispatch(setMessage('... waiting to full bot load ...'));
              setTimeout(() => {
                console.log('Bot is started, continue');
                resolve(true);
              }, 5000);
            }, 5000);
          }
        }).catch(() => {
          dispatch(setMessage('Cannot connect to bot.'));
          console.log('Bot not started yet, waiting');
          waitAfterStart = true;
          setTimeout(() => check(), 5000);
        });
    };
    check();
  });
}

export { isBotStarted };