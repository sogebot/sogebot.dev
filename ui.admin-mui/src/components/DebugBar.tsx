import { LoadingButton } from '@mui/lab';
import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText,
  TextField,
  Typography,
} from '@mui/material';
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

  useEffect(() => {
    if(showDebugManager && connectedToServer) {
      setOpen(true);
    }

    if (connectedToServer) {
      getSocket('/').emit('debug::get', (err, debugEnv) => {
        if (err) {
          return console.error(err);
        }
        setDebug(debugEnv);
      });
    }
  }, [showDebugManager, connectedToServer]);

  const setDebugEnv = React.useCallback(() => {
    setSaving(true);
    getSocket('/').emit('debug::set', debug, () => {
      return true;
    });
    setTimeout(() => {
      setOpen(false);
      setSaving(false);
    }, 1000);
  }, [ debug ]);

  useEffect(() => {
    if (!open) {
      dispatch(toggleDebugManager(false));
    }
  }, [open, dispatch]);

  return (<Dialog open={open} fullWidth>
    <DialogContent>
      <DialogContentText>
        <Typography variant={'h5'} sx={{
          fontWeight: 'bold', pb: 2,
        }}>Debug</Typography>
      </DialogContentText>

      <TextField
        fullWidth
        variant="outlined"
        value={debug}
        onChange={(event) => setDebug(event.target.value)}/>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setOpen(false)}>Close</Button>
      <LoadingButton loading={saving} variant='contained' onClick={() => setDebugEnv()}>Save</LoadingButton>
    </DialogActions>
  </Dialog>);
}