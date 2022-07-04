import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  Avatar, Button, Chip, Divider, Grid, IconButton, Typography,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import { Box } from '@mui/system';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getSocket } from '~/src/helpers/socket';
import translate from '~/src/helpers/translate';
import theme from '~/src/theme';

export const UserMenu: React.FC = () => {
  const refreshViewer = (user: null | Record<string, any>): Promise<any> => {
    if (typeof user === 'undefined' || user === null) {
      return new Promise(resolve => resolve(null));
    }
    const socket = getSocket('/core/users', true);

    return new Promise((resolve) => {
      socket.emit('viewers::findOne', user.id, (err: any, recvViewer: unknown) => {
        if (err) {
          return console.error(err);
        }
        if (recvViewer) {
          console.log('Logged in as', recvViewer);
          resolve(recvViewer);
        } else {
          console.error('Cannot find user data, try to write something in chat to load data');
          resolve(null);
        }
      });
    });
  };

  const viewerIs = (viewer: any) => {
    const status: string[] = [];
    const isArray = ['isFollower', 'isSubscriber', 'isVIP'] as const;
    isArray.forEach((item: typeof isArray[number]) => {
      if (viewer && viewer[item]) {
        status.push(item.replace('is', ''));
      }
    });
    return status;
  };

  const logout = () => {
    delete localStorage['cached-logged-user'];
    const socket = getSocket('/core/users', true);
    socket.emit('logout', {
      accessToken:  localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    });
    localStorage.code = '';
    localStorage.accessToken = '';
    localStorage.refreshToken = '';
    localStorage.userType = 'unauthorized';
    window.location.assign(window.location.origin + '/credentials/login#error=logged+out');
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { user } = useSelector((state: any) => state.user);
  const { configuration } = useSelector((state: any) => state.loader);
  const [ viewer, setViewer ] = React.useState<null | import('@sogebot/backend/d.ts/src/helpers/socket').ViewerReturnType>(null);

  const [interval, setInterval] = useState<null | number>(null);

  useEffect(() => {
    refreshViewer(user).then(o => setViewer(o));
    if (!interval) {
      setInterval(window.setInterval(() => {
        refreshViewer(user).then(o => setViewer(o));
      }, 60000));
    }
  }, [interval, user]);

  return (
    <>
      {user && Object.keys(configuration).length > 0
      && <><IconButton onClick={handleClick} sx={{ width: 'fit-content', alignSelf: 'center' }}>
        <Avatar src={user.profile_image_url}></Avatar>
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
      >
        <Box sx={{ px: 2 }}>
          <><Typography>{user.display_name}</Typography>
            <Typography variant='subtitle2' color={theme.palette.secondary.main}>{viewer?.permission.name}</Typography>
            {viewerIs(viewer)
              .map(o => {
                return (
                  <Chip label={o} key={o} sx={{ mr: 1 }} color="primary" size='small'/>
                );
              }
              )}
            <Divider sx={{ pt: 1 }}/>

            {viewer && <Grid container spacing={2} sx={{ pt: 1 }} width={400}>
              <Grid item xs={4} textAlign='center' sx={{ pa: 1 }}>
                { Intl.NumberFormat(configuration.lang).format(viewer.points ?? 0) }
                <Typography fontWeight={100}>{ translate('points') }</Typography>
              </Grid>
              <Grid item xs={4} textAlign='center' sx={{ pa: 1 }}>
                { Intl.NumberFormat(configuration.lang).format(viewer.messages ?? 0) }
                <Typography fontWeight={100}>{ translate('messages') }</Typography>
              </Grid>
              <Grid item xs={4} textAlign='center' sx={{ pa: 1 }}>
                { Intl.NumberFormat(configuration.lang).format(viewer.aggregatedBits) }
                <Typography fontWeight={100}>{ translate('bits') }</Typography>
              </Grid>
              <Grid item xs={4} textAlign='center' sx={{ pa: 1 }}>
                { Intl.NumberFormat(configuration.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((viewer.watchedTime ?? 0) / 1000 / 60 / 60) } h
                <Typography fontWeight={100}>{ translate('watched-time') }</Typography>
              </Grid>
              <Grid item xs={4} textAlign='center' sx={{ pa: 1 }}>
                { Intl.NumberFormat(configuration.lang, { style: 'currency', currency: configuration.currency }).format(viewer.aggregatedTips) }
                <Typography fontWeight={100}>{ translate('tips') }</Typography>
              </Grid>
            </Grid>
            }
          </>
          <Divider sx={{ pt: 1 }}/>

          <Grid container sx={{ pt: 1 }}>
            <Grid item xs={6}>
              <Button onClick={handleClose}>Close</Button>
            </Grid>
            <Grid item xs={6} textAlign='right'>
              <Button onClick={logout} startIcon={<LogoutIcon />} color='error'>Logout</Button>
            </Grid>
          </Grid>
        </Box>
      </Menu></>
      }
      {!user
      && <IconButton href='/credentials/login' title='Login'>
        <LoginIcon/>
      </IconButton>
      }
    </>
  );
};