import { CloseTwoTone } from '@mui/icons-material';
import LoginTwoToneIcon from '@mui/icons-material/LoginTwoTone';
import LogoutTwoToneIcon from '@mui/icons-material/LogoutTwoTone';
import { Avatar, Box, IconButton, InputAdornment, Link, TextField, Typography } from '@mui/material';
import { closeSnackbar, useSnackbar } from 'notistack';
import React from 'react';
import { useLocalstorageState } from 'rooks';

import { baseURL } from '../../helpers/getBaseURL';
import { getSocket } from '../../helpers/socket';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { scopes } from '../../routes/credentials/login';

export const UserSimple: React.FC = () => {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const [ user ] = useLocalstorageState<false | Record<string, any>>('cached-logged-user', false);
  const { enqueueSnackbar } = useSnackbar();
  const { isBotConnected } = useAppSelector((s: any) => s.loader);

  const logout = () => {
    delete localStorage['cached-logged-user'];
    const socket = getSocket('/core/users', true);
    socket.emit('logout', {
      accessToken:  localStorage.getItem(`${localStorage.server}::accessToken`),
      refreshToken: localStorage.getItem(`${localStorage.server}::refreshToken`),
    });
    localStorage[`${localStorage.server}::accessToken`] = '';
    localStorage[`${localStorage.server}::refreshToken`] = '';
    localStorage[`${localStorage.server}::userType`] = 'unauthorized';
    window.location.assign(baseURL);
  };

  React.useEffect(() => {
    if (user && isBotConnected) {
      getSocket('/', true).emit('token::broadcaster-missing-scopes', (missingScopes: string[]) => {
        if (missingScopes.length > 0) {
          console.error('Broadcaster is missing these scopes: ', missingScopes.join(', '));
          const notif = enqueueSnackbar(<Box>
            <Typography>Broadcaster is missing these scopes <small>{missingScopes.join(', ')}</small>.</Typography>
            <Typography>Please reauthenticate your broadcaster account at <Link sx={{
              display: 'inline-block', color: 'white !important', textDecorationColor: 'white !important', fontWeight: 'bold',
            }} href={`/settings/modules/services/twitch?server=${server}`}>Twitch module service</Link> settings.</Typography>
          </Box>, {
            action: <IconButton color='light' onClick={() => closeSnackbar(notif)} sx={{ color: 'white' }}>
              <CloseTwoTone/>
            </IconButton>,
            variant:          'error',
            autoHideDuration: null,
          });
        }
      });
    }
  }, [user, isBotConnected]);

  React.useEffect(() => {
    if (user) {
      for (const scope of scopes) {
        if (!user.scopes.includes(scope)) {
          console.error('Needed scope is missing. Logging out');
          logout();
          return;
        }
      }
    }
  }, [user]);

  const login = () => {
    window.location.assign(baseURL + '/credentials/login');
  };

  const getUser = () => {
    try {
      return JSON.parse(localStorage['cached-logged-user']);
    } catch {
      return false;
    }
  };

  return (
    <>{getUser() && <Box sx={{
      display: 'flex', alignItems: 'flex-end', width: '100%', borderBottom: '1px dotted rgba(255, 255, 255, 0.7)',
    }}>
      <Avatar
        variant="square"
        src={getUser().profile_image_url}
        sx={{
          width: 56, height: 56, backgroundColor: '#4f4f4f',
        }}></Avatar>
      <TextField
        sx={{
          flexGrow:                       1,
          '& .MuiInputBase-root':         { borderRadius: 0 },
          '& .MuiInputBase-root::before': { borderBottom: 0 },
        }}
        label="Logged in as"
        variant="filled"
        value={getUser().login}
        disabled
        InputProps={{
          startAdornment: <InputAdornment position="start">
          </InputAdornment>,
          endAdornment: <InputAdornment position="end">
            <IconButton color="error" onClick={logout}>
              <LogoutTwoToneIcon/>
            </IconButton>
          </InputAdornment>,
        }}
      />
    </Box>
    }
    {!getUser() && <TextField
      label="You must be logged in to access server"
      variant="filled"
      disabled
      InputProps={{
        endAdornment: <InputAdornment position="end">
          <IconButton color="success" onClick={login}>
            <LoginTwoToneIcon/>
          </IconButton>
        </InputAdornment>,
      }}
    />}
    </>
  );
};