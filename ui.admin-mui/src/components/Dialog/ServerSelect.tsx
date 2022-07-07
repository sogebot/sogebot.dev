import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert, Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, Stack, Switch, TextField,
} from '@mui/material';
import Image from 'next/image';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDidMount } from 'rooks';

import { UserSimple } from '@/components/User/Simple';
import sogebotLarge from '~/public/sogebot_large.png';
import { isBotStarted } from '~/src/isBotStarted';
import { setMessage, setServer } from '~/src/store/loaderSlice';
import { useRouter } from 'next/router';

export const ServerSelect: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [open, setOpen] = React.useState(true);
  const [connecting, setConnecting] = React.useState(false);
  const [autoConnect, setAutoConnecting] = React.useState(false);
  const [serverInputValue, setServerInputValue] = React.useState('http://localhost:20000');
  const [serverHistory, setServerHistory] = React.useState<string[]>([]);

  const [isValidHttps, setIsValidHttps] = React.useState(true);
  useEffect(() => {
    try {
      const url = new URL(serverInputValue);
      // localhost is allowed to use without https
      if (url.hostname === 'localhost') {
        setIsValidHttps(true);
      } else {
        setIsValidHttps(url.protocol === 'https:');
      }
    } catch (e) {
      setIsValidHttps(false);
    }
  }, [serverInputValue, isValidHttps]);

  function handleConnect (server: string) {
    if (server) {
      setConnecting(true);
      dispatch(setMessage('Connecting to server.'));
      console.log(`Connecting to ${server}`);
      dispatch(setServer(server));
      isBotStarted(dispatch, server).then(() => {
        // set autoconnect after successful load
        const autoConnectLS = JSON.parse(localStorage.serverAutoConnect ?? 'false');
        const serverHistoryLS = JSON.parse(localStorage.serverHistory ?? '[]');
        localStorage.serverAutoConnect = JSON.stringify(autoConnectLS || autoConnect);
        localStorage.serverHistory = JSON.stringify(Array.from(new Set([server, ...serverHistoryLS, 'http://localhost:20000'])));
      });
    }
  }

  const handleAutoConnectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoConnecting(event.target.checked);
  };

  React.useEffect(() => {
    if (router.isReady) {
      const autoConnectLS = JSON.parse(localStorage.serverAutoConnect ?? 'false');
      const serverHistoryLS = JSON.parse(localStorage.serverHistory ?? '[]');
      setServerHistory(Array.from(new Set([...serverHistoryLS, 'http://localhost:20000'])));
      setAutoConnecting(autoConnectLS);

      // autoconnect by server get paramater
      if (router.query.server) {
        setServerInputValue(router.query.server as string);
        handleConnect(router.query.server as string);
        return;
      }

      if (localStorage.server && !connecting) {
        setServerInputValue(localStorage.server);
        if (autoConnectLS) {
          handleConnect(localStorage.server);
        }
      }
    }
  }, [router.isReady]);

  const getUser = () => {
    try {
      return JSON.parse(localStorage['cached-logged-user']);
    } catch {
      return false;
    }
  };

  const { compatibleVersion, state, message, connectedToServer } = useSelector((s: any) => s.loader);

  useEffect(() => {
    if (connectedToServer && state) {
      setOpen(false);
    }
  }, [connectedToServer, state]);

  useEffect(() => {
    if (!message || message.includes('Cannot connect') || message.includes('access to this server')) {
      setConnecting(false);
    } else {
      setConnecting(true);
    }
  }, [message]);

  const handleLogin = () => {
    window.location.assign(window.location.origin + '/credentials/login');
  };

  return (<Dialog open={open}>
    <DialogTitle>
      <Image src={sogebotLarge} width={190} height={25} layout="fixed" unoptimized alt="sogeBot Logo"/>
      <br/>
      Connect to server
    </DialogTitle>
    <DialogContent>
      <FormGroup>
        <Autocomplete
          fullWidth
          disablePortal
          options={serverHistory}
          value={serverInputValue}
          onChange={(event: any, newValue: string | null) => {
            setServerInputValue(newValue ?? serverInputValue);
          }}
          inputValue={serverInputValue}
          onInputChange={(event, newInputValue) => {
            setServerInputValue(newInputValue);
          }}
          renderInput={(params) =>
            <TextField
              error={!isValidHttps}
              helperText={isValidHttps ? '' : 'Incorrect entry. You can connect only on https unless using localhost'}
              type="url"
              label="Server address"
              variant="standard"
              {...params}/>
          }
        />
        <FormControlLabel control={<Switch checked={autoConnect} onChange={handleAutoConnectChange} />} label="Automatically connect on next load" />
      </FormGroup>

      <Stack spacing={1} sx={{ pt: 2 }}>
        <Alert severity="info">This is client-based application and no informations are saved on our server.</Alert>
        <Alert severity="warning">Compatible with bot version at least {compatibleVersion}.</Alert>
        <UserSimple/>
      </Stack>
    </DialogContent>
    <DialogActions>
      {(connecting || message) && <Alert severity={message.includes('Cannot') || message.includes('access') ? 'error' : 'info'} variant="outlined" sx={{ padding: '0 20px', marginRight: '20px' }}>
        {message}
      </Alert>}
      {getUser() && <LoadingButton
        onClick={() => handleConnect(serverInputValue)}
        loading={connecting}
        disabled={!isValidHttps}
        variant="outlined"
      >
        Connect
      </LoadingButton>}
      {!getUser() && <LoadingButton
        onClick={handleLogin}
        color="info"
        variant="outlined"
      >
        Login
      </LoadingButton>}
    </DialogActions>
  </Dialog>);
};