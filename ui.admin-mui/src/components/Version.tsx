import { CloseTwoTone } from '@mui/icons-material';
import { Box, Fade, IconButton, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { closeSnackbar, useSnackbar } from 'notistack';
import React from 'react';

import getAccessToken from '../getAccessToken';
import { LinearProgressTimeout } from './Progress/LinearProgressTimeout';
import { useAppSelector } from '../hooks/useAppDispatch';

console.group('UI VERSION');
console.log(process.env.REACT_APP_VERSION);
console.groupEnd();

export const Version: React.FC = () => {
  const { connectedToServer, server } = useAppSelector(s => s.loader);
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if ((process.env.REACT_APP_COMMIT || '').length > 0) {
      // we have base path, skip checks
      return;
    }

    if (connectedToServer && server) {
      axios.get(`${server}/_dash_version`, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      })
        .then(res => {
          console.group('DOCKER UI VERSION');
          console.log(res.data);
          console.groupEnd();
          if (process.env.REACT_APP_VERSION) {
            if (!process.env.REACT_APP_VERSION.includes(res.data)) {
              console.warn(`UI version (${process.env.REACT_APP_VERSION}) does not match docker version (${res.data})`);
              const notif = enqueueSnackbar(<Stack>
                <div>There is new version of UI available. <br/> Please force refresh page by <Typography component='strong' variant='button' sx={{ fontWeight: 'bold', pl: 0.5, }}>Ctrl+Shift+R</Typography>. <br/>If refresh doesn't help, wait few minutes and try again.</div>
                <LinearProgressTimeout
                  onClose={() => closeSnackbar(notif)}
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    bottom: 0,
                    left: 0,
                  }} timeout={10000} />
              </Stack>, {
                action: <IconButton color='light' onClick={() => closeSnackbar(notif)} sx={{ color: 'white' }}>
                  <CloseTwoTone/>
                </IconButton>,
                variant: 'info',
                autoHideDuration: null,
              });
            } else {
              console.log('UI version matches docker version');
            }
          }
        })
        .catch(err => {
          console.error('Error getting server version:', err);
        });
    }
  }, [connectedToServer, server]);

  return <Fade in={!connectedToServer} unmountOnExit mountOnEnter>
    <Box sx={{
      position: 'absolute', left: 0, bottom: 0,
    }}>
      <Typography component='span' sx={{ fontWeight: 'bold' }}>UI version:</Typography>
      {' '}
      <Typography component='span'>{process.env.REACT_APP_VERSION ?? 'unknown'}</Typography>
    </Box>
  </Fade>;
};