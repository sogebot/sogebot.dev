import LoginTwoToneIcon from '@mui/icons-material/LoginTwoTone';
import LogoutTwoToneIcon from '@mui/icons-material/LogoutTwoTone';
import {
  Avatar, IconButton, InputAdornment, TextField,
} from '@mui/material';
import React from 'react';

import { getSocket } from '~/src/helpers/socket';

export const UserSimple: React.FC = () => {
  const logout = () => {
    delete localStorage['cached-logged-user'];
    const socket = getSocket('/core/users', true);
    socket.emit('logout', {
      accessToken:  localStorage.getItem(`${localStorage.currentServer}::accessToken`),
      refreshToken: localStorage.getItem(`${localStorage.currentServer}::refreshToken`),
    });
    localStorage.code = '';
    localStorage[`${localStorage.currentServer}::accessToken`] = '';
    localStorage[`${localStorage.currentServer}::refreshToken`] = '';
    localStorage[`${localStorage.currentServer}::userType`] = 'unauthorized';
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
    <>{getUser() && <TextField
      label="Logged in as"
      variant="filled"
      value={getUser().login}
      disabled
      InputProps={{
        startAdornment: <InputAdornment position="start">
          <Avatar src={getUser().profile_image_url}></Avatar>
        </InputAdornment>,
        endAdornment: <InputAdornment position="end">
          <IconButton color="error" onClick={logout}>
            <LogoutTwoToneIcon/>
          </IconButton>
        </InputAdornment>,
      }}
    />
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