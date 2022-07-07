import LogoutIcon from '@mui/icons-material/Logout';
import {
  Alert, Avatar, Button, Paper, Stack, Typography,
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

  const getUser = () => {
    try {
      return JSON.parse(localStorage['cached-logged-user']);
    } catch {
      return false;
    }
  };

  return (
    <>{getUser() && <Paper sx={{ pa: 1 }}>
      <Typography fontWeight={'bold'} sx={{ padding: '10px' }}>Logged in as:</Typography>
      <Stack direction="row" spacing={2} justifyContent={'center'} alignItems={'center'} component="span">
        <Avatar src={getUser().profile_image_url}></Avatar>
        <Typography>{getUser().login}</Typography>
        <Button onClick={logout} startIcon={<LogoutIcon />} sx={{ paddingleft: '20px' }} color='error'>Logout</Button>
      </Stack></Paper>
    }
    {!getUser() && <Alert severity="error">You need to be logged in to access bot server.</Alert>}
    </>
  );
};