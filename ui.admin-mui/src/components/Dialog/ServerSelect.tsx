import ContentPasteTwoToneIcon from '@mui/icons-material/ContentPasteTwoTone';
import InventoryTwoToneIcon from '@mui/icons-material/InventoryTwoTone';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert, Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, FormGroup, IconButton, InputAdornment, Stack, TextField,
} from '@mui/material';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, {
  useCallback, useEffect, useMemo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import semver from 'semver';

import { UserSimple } from '@/components/User/Simple';
import sogebotLarge from '~/public/sogebot_large.png';
import { versions } from '~/src/compatibilityList';
import { isBotStarted } from '~/src/isBotStarted';
import { setMessage, setServer } from '~/src/store/loaderSlice';

const checkURLValidity = (serverURL: string) => {
  if (serverURL === '-- demo bot for demonstration purpose only --') {
    return true;
  }
  try {
    const url = new URL(serverURL);
    return url.hostname === 'localhost' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

export const ServerSelect: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [isInitial, setIsInitial] = React.useState(true);
  const [connecting, setConnecting] = React.useState(false);

  const [validVersionError, setValidVersionError] = React.useState<string | null>(null);

  const [serverInputValue, setServerInputValue] = React.useState('http://localhost:20000');
  const [serverHistory, setServerHistory] = React.useState<string[]>([]);

  const { state, message, connectedToServer } = useSelector((s: any) => s.loader);

  const [isValidHttps, setIsValidHttps] = React.useState(true);
  useEffect(() => {
    try {
      const url = new URL(serverInputValue);
      if (url.origin !== serverInputValue) {
        setServerInputValue(url.origin);
      }
      setIsValidHttps(checkURLValidity(serverInputValue));
    } catch {
      setIsValidHttps(serverInputValue.includes('-- demo bot for demonstration purpose only --'));
    }

    setValidVersionError(null);
    setConnecting(false);
  }, [serverInputValue]);

  React.useEffect(() => {
    const serverHistoryLS = JSON.parse(localStorage.serverHistory ?? '[]');
    setServerHistory(
      Array.from(
        new Set([...serverHistoryLS, 'http://localhost:20000', '-- demo bot for demonstration purpose only --']
          .filter(o => o !== 'https://demobot.sogebot.xyz'))
      ).map(item => item.startsWith('http') ? new URL(item).origin : item)
    );
  }, []);

  const handleConnect = useCallback((server: string) => {
    if (server) {
      setConnecting(true);
      dispatch(setMessage('Connecting to server.'));
      console.log(`Connecting to ${server}`);

      let serverURL = server;
      if (server === '-- demo bot for demonstration purpose only --') {
        serverURL = 'https://demobot.sogebot.xyz';
      }

      const url = new URL(serverURL);
      // run health check
      axios.get(`${url.origin}/health`)
        .then(res => {
          // request is not valid anymore
          if (serverURL !== url.origin) {
            return;
          }
          // 'OK' response was last in 16.8.0
          const version = res.data === 'OK' ? '16.8.0' : res.data;
          for (const versionKey of Object.keys(versions).reverse()) {
            console.log({
              version, versionKey, satisfies: semver.satisfies(version, versionKey),
            });
            if (semver.satisfies(version, versionKey)) {
              // we have found version and returning basepath
              window.location.href = `https://dash.sogebot.xyz/${versions[versionKey as keyof typeof versions]}/?server=${server}`;
              return;
            }
          }

          // version is higher than in compatibility list -> without base path
          dispatch(setServer(serverURL));
          isBotStarted(dispatch, serverURL).then(() => {
            const serverHistoryLS = JSON.parse(localStorage.serverHistory ?? '[]');
            localStorage.serverHistory = JSON.stringify(
              Array
                .from(new Set([serverURL, ...serverHistoryLS, 'http://localhost:20000']))
            );
          });
          return;
        })
        .catch((e) => {
          console.error(e);
          // request is not valid anymore
          if (serverURL !== url.origin) {
            return;
          }
          setValidVersionError(`Something went wrong connecting to server ${url.origin}`);
        });
    }
  }, [dispatch, router]);

  React.useEffect(() => {
    if (isInitial && router.isReady && !connecting && (!message || (!message.includes('Cannot connect') && !message.includes('You don\'t have access to this server')))) {
      // autoconnect by server get parameter
      const queryServer = router.query.server as string;
      if (queryServer) {
        setServerInputValue(queryServer);
        if (checkURLValidity(queryServer)) {
          handleConnect(queryServer);
        }
        return;
      }

      if (localStorage.server) {
        setServerInputValue(JSON.parse(localStorage.server));
      }
      setIsInitial(false);
    }
  }, [router, connecting, message, isInitial, handleConnect]);

  const getUser = () => {
    try {
      return JSON.parse(localStorage['cached-logged-user']);
    } catch {
      return false;
    }
  };

  const open = useMemo(() => !(connectedToServer && state), [connectedToServer, state]);

  useEffect(() => {
    if (!message) {
      setConnecting(false);
    } else if (message.includes('Cannot connect') || message.includes('access to this server')) {
      setConnecting(false);
    } else {
      setConnecting(true);
    }
  }, [message]);

  const [ copied, setCopied ] = React.useState(false);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (<Dialog open={open} hideBackdrop sx={{ zIndex: 0 }}>
    <DialogTitle>
      <Image src={sogebotLarge} width={190} height={25} unoptimized alt="sogeBot Logo"/>
      <br/>
      Connect to server
    </DialogTitle>
    <DialogContent>
      <FormGroup>
        <Autocomplete
          selectOnFocus
          fullWidth
          handleHomeEndKeys
          options={serverHistory}
          filterOptions={(x) => x}
          value={serverInputValue}
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
              variant="filled"
              {...params}/>
          }
        />
        <UserSimple/>
        {typeof window !== 'undefined' && isValidHttps && !serverInputValue.includes('-- demo') && <TextField
          label="Autoconnect link"
          helperText={'Use this link to skip server select'}
          variant="filled"
          value={`${window.location.origin}?server=${serverInputValue}`}
          disabled
          sx={{ '& .MuiInputBase-root': { borderRadius: 0 } }}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              <IconButton onClick={() => copyToClipboard(`${window.location.origin}?server=${serverInputValue}`)}>
                {copied ? <InventoryTwoToneIcon/> : <ContentPasteTwoToneIcon/>}
              </IconButton>
            </InputAdornment>,
          }}
        />
        }
      </FormGroup>

      <Stack spacing={1} sx={{ pt: 2 }} alignItems='center'>
        <Alert severity="info" sx={{ width: '100%' }}>This is client-based application and no informations are saved on our server.</Alert>
        {validVersionError && <Alert severity="error" sx={{ width: '100%' }}>{validVersionError}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      {((connecting || message)) && <Alert severity={message.includes('Cannot') || message.includes('access') ? 'error' : 'info'} variant="outlined" sx={{
        padding: '0 20px', marginRight: '20px',
      }}>
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
    </DialogActions>
  </Dialog>);
};