import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert, Dialog, DialogActions, DialogContent, DialogTitle,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useIntervalWhen } from 'rooks';

import { useAppSelector } from '../hooks/useAppDispatch';

export const LoginWarning: React.FC = () => {
  const showLoginWarning = useAppSelector(s => s.loader.showLoginWarning || false);
  const [ seconds, setSeconds ] = useState(15);

  useIntervalWhen(() => {
    setSeconds(o => o - 1);
  }, 1000, seconds > 0 && showLoginWarning, true);

  useEffect(() => {
    if (seconds === 0) {
      handleLogin();
    }
  }, [seconds]);

  const handleLogin = () => {
    window.location.assign(window.location.origin + '/credentials/login');
  };

  return (<Dialog open={showLoginWarning}>
    <DialogTitle>
      Twitch login expired
    </DialogTitle>
    <DialogContent>
      <Alert severity="warning">Your twitch login expired and needs to be reauthorized.</Alert>
    </DialogContent>
    <DialogActions>
      <LoadingButton
        onClick={handleLogin}
        color="warning"
        variant="contained"
      >
         Login &nbsp; <small>{seconds}</small>
      </LoadingButton>
    </DialogActions>
  </Dialog>);
};