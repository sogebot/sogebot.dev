import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert, Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, Typography, FormGroup, Stack, Switch, TextField,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

export const LoginWarning: React.FC = () => {
  const showLoginWarning = useSelector<any, boolean>((s: any) => s.loader.showLoginWarning || false);
  const [ seconds, setSeconds ] = useState(15);

  useIntervalWhen(() => {
    setSeconds(o => o - 1);
  }, 1000, seconds > 0 && showLoginWarning, true)

  useEffect(() => {
    if (seconds === 0) {
      handleLogin()
    }
  }, [seconds])

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