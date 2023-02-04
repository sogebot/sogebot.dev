import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  Avatar, Button, Chip, Divider, Grid, IconButton, Typography,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import { Box } from '@mui/system';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

export const UserMenu: React.FC = () => {
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { user } = useSelector((state: any) => state.user);
  const { configuration } = useSelector((state: any) => state.loader);
  const [ viewer, setViewer ] = React.useState<null | import('@sogebot/backend/d.ts/src/helpers/socket').ViewerReturnType>(null);
  const [ logged, setLogged ] = React.useState(false);

  const viewerIs = (data: any) => {
    const status: string[] = [];
    const isArray = ['isFollower', 'isSubscriber', 'isVIP'] as const;
    isArray.forEach((item: typeof isArray[number]) => {
      if (data && data[item]) {
        status.push(item.replace('is', ''));
      }
    });
    return status;
  };

  const logout = () => {
    delete localStorage['cached-logged-user'];
    const socket = getSocket('/core/users', true);
    socket.emit('logout', {
      accessToken:  localStorage.getItem(`${sessionStorage.server}::accessToken`),
      refreshToken: localStorage.getItem(`${sessionStorage.server}::refreshToken`),
    });
    localStorage[`${sessionStorage.server}::accessToken`] = '';
    localStorage[`${sessionStorage.server}::refreshToken`] = '';
    localStorage[`${sessionStorage.server}::userType`] = 'unauthorized';
    window.location.assign(window.location.origin + '/credentials/login#error=logged+out');
  };
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const refresh = React.useCallback(() => {
    if (typeof user === 'undefined' || user === null) {
      return;
    }
    getSocket('/core/users', true).emit('viewers::findOneBy', user.id, (err, recvViewer) => {
      if (err) {
        return console.error(err);
      }
      if (recvViewer) {
        if (!logged) {
          console.log('Logged in as', recvViewer);
          setLogged(true);
        }
        console.log({ recvViewer });
        setViewer(recvViewer);
      } else {
        console.error('Cannot find user data, try to write something in chat to load data');
        setViewer(null);
      }
    });
  }, [user, logged]);

  useEffect(() => {
    refresh();
  }, [ refresh ]);
  useIntervalWhen(() => refresh(), 60000, true, true);

  return (
    <>
      {user && Object.keys(configuration).length > 0
      && <><IconButton onClick={handleClick} sx={{
        width: 'fit-content', alignSelf: 'center',
      }}>
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
            <Typography variant='subtitle2' color={theme.palette.info.main}>{viewer?.permission.name}</Typography>
            {viewerIs(viewer)
              .map(o => {
                return (
                  <Chip label={o} key={o} sx={{ mr: 1 }} color="primary" size='small'/>
                );
              },
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
                { Intl.NumberFormat(configuration.lang, {
                  minimumFractionDigits: 2, maximumFractionDigits: 2,
                }).format((viewer.watchedTime ?? 0) / 1000 / 60 / 60) } h
                <Typography fontWeight={100}>{ translate('watched-time') }</Typography>
              </Grid>
              <Grid item xs={4} textAlign='center' sx={{ pa: 1 }}>
                { Intl.NumberFormat(configuration.lang, {
                  style: 'currency', currency: configuration.currency,
                }).format(viewer.aggregatedTips) }
                <Typography fontWeight={100}>{ translate('tips') }</Typography>
              </Grid>
            </Grid>
            }
          </>
          <Divider sx={{ pt: 1 }}/>

          <Grid container sx={{ pt: 1 }}>
            <Grid item xs={6}>
              <Button onClick={handleClose} sx={{ width: 150 }}>Close</Button>
            </Grid>
            <Grid item xs={6} textAlign='right'>
              <Button onClick={logout} startIcon={<LogoutIcon />} color='error' sx={{ width: 150 }}>Logout</Button>
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