import LoginTwoToneIcon from '@mui/icons-material/LoginTwoTone';
import LogoutTwoToneIcon from '@mui/icons-material/LogoutTwoTone';
import {
  Avatar, Box, IconButton, InputAdornment, TextField,
} from '@mui/material';
import React from 'react';

import { getSocket } from '../../helpers/socket';

export const UserSimple: React.FC = () => {
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
    window.location.assign(window.location.origin);
  };

  const login = () => {
    window.location.assign(window.location.origin + '/credentials/login');
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