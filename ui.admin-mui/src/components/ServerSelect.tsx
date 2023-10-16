import ContentPasteTwoToneIcon from '@mui/icons-material/ContentPasteTwoTone';
import InventoryTwoToneIcon from '@mui/icons-material/InventoryTwoTone';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert, Autocomplete, Dialog, DialogActions, DialogContent,
  DialogTitle, FormGroup, IconButton, InputAdornment, Link,
  Stack, TextField,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo } from 'react';
import semver from 'semver';

import { UserSimple } from './User/Simple';
import { versions } from '../compatibilityList';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import useMobile from '../hooks/useMobile';
import useQuery from '../hooks/useQuery';
import sogebotLarge from '../images/sogebot_large.png';
import { isBotStarted } from '../isBotStarted';
import { setMessage, setServer } from '../store/loaderSlice';

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

let connecting = false;

type ServerSelectProps = {
  /*
   * Hides connection dialog, usable in popouts
  */
  passive?: boolean;
};

export const ServerSelect: React.FC<ServerSelectProps> = (props) => {
  const dispatch = useAppDispatch();
  const query = useQuery();
  const isMobile = useMobile();
  const { enqueueSnackbar } = useSnackbar();

  const [isInitial, setIsInitial] = React.useState(true);

  const [validVersionError, setValidVersionError] = React.useState<string | null>(null);

  const [serverInputValue, setServerInputValue] = React.useState('http://localhost:20000');
  const [serverHistory, setServerHistory] = React.useState<string[]>([]);
  const [invalidURL, setInvalidURL] = React.useState(false);

  const { state, message, connectedToServer } = useAppSelector((s: any) => s.loader);

  React.useEffect(() => {
    if ((connecting || message)) {
      if (message.toLowerCase().includes('checking')) {
        return;
      }
      enqueueSnackbar({
        message,
        variant: message.includes('Cannot') || message.includes('access') ? 'error' : 'default',
      });
    }
  }, [ message ]);

  useEffect(() => {
    if (serverInputValue.startsWith('-- demo')) {
      setInvalidURL(false);
      return;
    }
    try {
      new URL(serverInputValue);
      setInvalidURL(false);
    } catch {
      setInvalidURL(true);
    } finally {
      setValidVersionError(null);
      connecting = false;
    }
  }, [serverInputValue]);

  React.useEffect(() => {
    const serverHistoryLS = JSON.parse(localStorage.serverHistory ?? '[]');
    setServerHistory(
      Array.from(
        new Set([...serverHistoryLS, 'http://localhost:20000', '-- demo bot for demonstration purpose only --']
          .filter(o => o !== 'https://demobot.sogebot.xyz')),
      ).map(item => item.startsWith('http') ? new URL(item).origin : item),
    );
  }, []);

  const handleConnect = (server: string) => {
    if (server) {
      if (server.startsWith('-- demo')) {
        server = 'https://demobot.sogebot.xyz';
      }
      connecting = true;
      dispatch(setMessage(`Connecting to ${server}.`));
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

          // we don't have base path, do checks
          if ((process.env.PUBLIC_URL || '').length === 0) {
            // 'OK' response was last in 16.8.0
            const version = res.data === 'OK' ? '16.8.0' : res.data;
            for (const versionKey of Object.keys(versions).reverse()) {
              if (semver.satisfies(version, versionKey)) {
                // we have found version and returning basepath
                window.location.href = `https://dash.sogebot.xyz/${versions[versionKey as keyof typeof versions]}/?server=${server}`;
                return;
              }
            }
          }

          // version is higher than in compatibility list -> without base path
          dispatch(setServer(serverURL));
          isBotStarted(dispatch, serverURL).then(() => {
            const serverHistoryLS = JSON.parse(localStorage.serverHistory ?? '[]');
            localStorage.serverHistory = JSON.stringify(
              Array
                .from(new Set([serverURL, ...serverHistoryLS, 'http://localhost:20000'])),
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
  };

  React.useEffect(() => {
    if (isInitial && !connecting && (!message || (!message.includes('Cannot connect') && !message.includes('You don\'t have access to this server')))) {
      // autoconnect by server get parameter
      const queryServer = query.get('server');
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
  }, [query, message, isInitial, handleConnect]);

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
      connecting = false;
    } else if (message.includes('Cannot connect') || message.includes('access to this server')) {
      connecting = false;
    } else {
      connecting = true;
    }
  }, [message]);

  const [ copied, setCopied ] = React.useState(false);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (<Dialog open={open && !props.passive} hideBackdrop sx={{ zIndex: 0 }} fullScreen={isMobile}>
    <DialogTitle sx={{
      display:        'flex',
      flexDirection:  'column',
      flex:           '1 1 auto',
      justifyContent: 'flex-end',
    }}>
      <img src={sogebotLarge} width={190} height={25} alt="sogeBot Logo"/>
      Connect to server
    </DialogTitle>
    <DialogContent sx={{
      display:        'flex',
      flexDirection:  'column',
      justifyContent: 'flex-start',
      flex:           '0 0 auto',
    }}>
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
              type="url"
              label="Server address"
              variant="filled"
              {...params}/>
          }
        />

        <Alert severity="warning" >
            If you are using <strong>HTTP without SSL</strong>, you may not be able to connect due to use of unsecured bot access on secured website.
            You need to allow mixed content for this website. It is <strong>strongly advised</strong> to use <strong>HTTPS</strong>.
          {' '}
          <Link href='https://stackoverflow.com/a/24434461' target='_blank'>How to allow mixed content?</Link>
        </Alert>

        <UserSimple/>
        {typeof window !== 'undefined' && !serverInputValue.includes('-- demo') && <TextField
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
    <DialogActions sx={{
      flex: '1 0 auto', alignItems: 'flex-start',
    }}>
      {getUser() && <LoadingButton
        disabled={invalidURL}
        onClick={() => handleConnect(serverInputValue)}
        loading={message && (message.toLowerCase().includes('connecting') || message.toLowerCase().includes('checking'))}
        fullWidth
        variant="contained"
      >
        Connect
      </LoadingButton>}
    </DialogActions>
  </Dialog>);
};