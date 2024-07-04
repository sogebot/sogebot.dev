import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useLocalstorageState } from 'rooks';

import getAccessToken from '../getAccessToken';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { toggleDebugManager } from '../store/loaderSlice';

export default function DebugBar() {
  const [ open, setOpen ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const { connectedToServer, showDebugManager } = useAppSelector(s => s.loader);
  const [ debug, setDebug ] = useState('');
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  useEffect(() => {
    if(showDebugManager && connectedToServer) {
      setOpen(true);
    }

    if (connectedToServer) {
      axios.get(`${server}/api/core/panel/debug`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } }).then(({ data }) => {
        console.log({ debug: data.data });
        setDebug(data.data);
      });
    }
  }, [showDebugManager, connectedToServer]);

  const setDebugEnv = async (debugInput: string) => {
    setSaving(true);

    console.groupCollapsed('debug::set');

    console.log('Sending debug', debugInput);
    await new Promise(resolve => {
      axios.post(`${server}/api/core/panel/debug`, { debug: debugInput }, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
      setTimeout(() => resolve(true), 200);
    });

    setSaving(false);
    setOpen(false);
    enqueueSnackbar('Debug set successfully', { variant: 'success' });
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