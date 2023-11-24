import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';

import { getSocket } from '../helpers/socket';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { toggleDebugManager } from '../store/loaderSlice';

export default function DebugBar() {
  const [ open, setOpen ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const { connectedToServer, showDebugManager } = useAppSelector(s => s.loader);
  const [ debug, setDebug ] = useState('');
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if(showDebugManager && connectedToServer) {
      setOpen(true);
    }

    if (connectedToServer) {
      getSocket('/').emit('debug::get', (err, debugEnv) => {
        if (err) {
          return console.error(err);
        }
        console.log({ debug: debugEnv });
        setDebug(debugEnv);
      });
    }
  }, [showDebugManager, connectedToServer]);

  const setDebugEnv = async (debugInput: string, isRetry = false) => {
    setSaving(true);

    console.groupCollapsed('debug::set');

    console.log('Sending debug', debugInput);
    await new Promise(resolve => {
      getSocket('/').emit('debug::set', debugInput, () => {});
      setTimeout(() => resolve(true), 200);
    });
    console.log('Checking debug');
    const result = await new Promise<boolean>((resolve, reject) => getSocket('/').emit('debug::get', (err, debugEnv) => {
      if (err) {
        return reject(err);
      }

      console.log('Received debug', { debugEnv });
      resolve(debugEnv === debugInput);
    }));

    if (result) {
      setSaving(false);
      setOpen(false);
      enqueueSnackbar('Debug set successfully', { variant: 'success' });
      return;
    } else {
      if (isRetry) {
        setSaving(false);
        enqueueSnackbar('Failed to set debug', { variant: 'error' });
        return console.error('Failed to set debug');
      }
      setDebugEnv(debugInput, true);
    }
    console.groupEnd();
  };

  useEffect(() => {
    if (!open) {
      dispatch(toggleDebugManager(false));
    }
  }, [open, dispatch]);

  return (<Dialog open={open} fullWidth>
    <DialogTitle>Debug</DialogTitle>
    <DialogContent dividers>
      <TextField
        fullWidth
        variant="outlined"
        value={debug}
        onKeyDown={(ev) => ev.key === 'Enter' && setDebugEnv(debug)}
        onChange={(event) => setDebug(event.target.value)}/>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setOpen(false)}>Close</Button>
      <LoadingButton loading={saving} variant='contained' onClick={() => setDebugEnv(debug)}>Save</LoadingButton>
    </DialogActions>
  </Dialog>);
}