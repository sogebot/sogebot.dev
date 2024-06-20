import LoadingButton from '@mui/lab/LoadingButton';
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormGroup, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo } from 'react';
import semver from 'semver';

import { CopyButton } from './Form/Input/Adornment/Copy';
import { UserSimple } from './User/Simple';
import { versions } from '../compatibilityList';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import useMobile from '../hooks/useMobile';
import useQuery from '../hooks/useQuery';
import useSSL from '../hooks/useSSL';
import sogebotLarge from '../images/sogebot_large.png';
import { isBotStarted } from '../isBotStarted';
import { setMessage, setServer } from '../store/loaderSlice';
import theme from '../theme';

const checkURLValidity = (serverURL: string) => {
  if (serverURL === '-- demo bot for demonstration purpose only --') {
    return true;
  }
  try {
    new URL(serverURL);
    return true;
  } catch (e) {
    return false;
  }
};

let connecting = false;
let dashboardInvalid = false;

type ServerSelectProps = {
  /*
   * Hides connection dialog, usable in popouts
  */
  passive?: boolean;
};

let error: string | null = null;
if (window.location) {
  const hash = window.location.hash;
  error = hash.replace('#error=', '');
  if (error.trim().length === 0) {
    error = null;
  }
}

export const ServerSelect: React.FC<ServerSelectProps> = (props) => {
  const dispatch = useAppDispatch();
  const query = useQuery();
  const isMobile = useMobile();
  const isSSL = useSSL();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [isInitial, setIsInitial] = React.useState(true);

  const [validVersionError, setValidVersionError] = React.useState<string | null>(null);

  const [serverInputValue, setServerInputValue] = React.useState('http://localhost:20000');
  const [serverHistory, setServerHistory] = React.useState<string[]>([]);
  const [invalidURL, setInvalidURL] = React.useState(false);

  const { state, message, connectedToServer } = useAppSelector((s: any) => s.loader);

  React.useEffect(() => {
    checkIfDashboardIsValid();

    if (error) {
      if (error === 'access_denied') {
        enqueueSnackbar({
          message: `Access to dashboard was denied. Please try again.`,
          variant: 'error',
          autoHideDuration: 30000,
          action: (key) => (
            <Button sx={{
              color: 'white',
              borderColor: 'white',
            }} onClick={() => {
              closeSnackbar(key);
            }}>Dismiss</Button>
          )
        });
      }
    }
  }, []);

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

  const checkIfDashboardIsValid = () => {
    const currentURL = new URL(window.location.href);
    if ((process.env.REACT_APP_COMMIT || '').length === 0) {
      // check if path actually doesn't contain compatibility version
      let showError = false;
      for (const commit of Object.values(versions)) {
        if (showError) {
          enqueueSnackbar({
            message: <Box>
              <Typography>
                This shouldn't happen! This dashboard version is <u>not VALID</u>.{' '}
                <strong>Please report</strong> on discord with your <strong>current URL link</strong>.
              </Typography>
              <Typography>
                If you need to access this dashboard, you can try even older version <Link sx={{
                  display: 'inline-block', color: 'white !important', textDecorationColor: 'white !important', fontWeight: 'bold',
                }} href={`https://dash.sogebot.xyz/${commit}`}>https://dash.sogebot.xyz/{commit}</Link>.
              </Typography>
            </Box>,
            variant: 'error',
            autoHideDuration: null,
          });
          return;
        }
        console.log('check', currentURL.pathname, `/${commit}/`);
        if (currentURL.pathname.includes(commit)) {
          showError = true;
          dashboardInvalid = true;
        }
      }
    }
  };

  const handleConnect = (server: string) => {
    if (connecting || dashboardInvalid) {
      return;
    }
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
          if ((process.env.REACT_APP_COMMIT || '').length === 0) {

            // 'OK' response was last in 16.8.0
            const version = res.data === 'OK' ? '16.8.0' : res.data;
            for (const versionKey of Object.keys(versions).reverse()) {
              if (semver.satisfies(version, versionKey)) {
                // we have found version and returning basepath
                window.location.href = `${new URL(window.location.href).origin}/${versions[versionKey as keyof typeof versions]}/?server=${server}`;
                return;
              }
            }
          }

          // version is higher than in compatibility list -> without base path
          dispatch(setServer(serverURL));
          isBotStarted(dispatch, serverURL).then(() => {
            // we need to change server in url
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
          dispatch(setMessage(`Cannot connect to ${server}.`));
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
  }, [query, message, isInitial]);

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
      return;
    }
    if (message.includes('Cannot connect') || message.includes('access to this server')) {
      connecting = false;
    } else {
      connecting = true;
    }
  }, [message]);

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

        {isSSL
          ? <Alert severity="warning">
              If you are using <strong>HTTP without SSL</strong>, you may not be able to connect due to use of unsecured bot access on secured website.
              You need to allow mixed content for this website. It is <strong>strongly advised</strong> to use <strong>HTTPS</strong>.
            {' '}
            <Link href='https://stackoverflow.com/a/24434461' target='_blank'>How to allow mixed content?</Link>
          </Alert>
          : <Alert severity="error">
            You are using <strong>HTTP</strong> connection. It is <strong>strongly advised</strong> to use <Link sx={{
              color: theme.palette.error.light,
            }} href='https://dash.sogebot.xyz'>secured dashboard</Link>.
            Some of the features like Twitch embeds will not work on HTTP version.
          </Alert>}

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
              <CopyButton text={`${window.location.origin}?server=${serverInputValue}`}/>
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