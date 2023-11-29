import { Box, Button, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { useLocalstorageState, useRefElement } from 'rooks';

import { importCustomCommands, importPlaylist, importTimers } from './nightbot-utils';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesImportNightbot: React.FC<{
  onVisible: () => void;
}> = ({ onVisible }) => {
  const [ref, element] = useRefElement<HTMLElement>();
  const scrollY = useAppSelector((state) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (
        element.offsetTop < scrollY + 100
        && element.offsetTop + element.clientHeight > scrollY - 100
      ) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const [user, setUser] = React.useState('Not Authorized');
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const [accessToken, setAccessToken] = useLocalstorageState<null | string>(
    'nightbot::accessToken',
    null
  );
  const [userLoadInProgress, setUserLoadInProgress] = React.useState(false);

  React.useEffect(() => {
    async function getUserData() {
      if (!accessToken) {
        return;
      }
      setUserLoadInProgress(true);
      const response = await axios.get('https://api.nightbot.tv/1/me', {
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      if (response.status !== 200) {
        setAccessToken(null);
      } else {
        setUser(`${response.data.user.displayName}#${response.data.user._id}`);
      }
      setUserLoadInProgress(false);
    }
    getUserData();
  }, [accessToken]);

  const authorize = React.useCallback(() => {
    const popup = window.open(
      window.location.origin +
        (process.env.REACT_APP_COMMIT ? `/${process.env.REACT_APP_COMMIT}/` : '/') +
        'credentials/nightbot',
      'popup',
      'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no'
    );
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [enqueueSnackbar]);

  const revoke = React.useCallback(() => {
    setAccessToken(null);
    setUser('Not Authorized');
    enqueueSnackbar('User access revoked.', { variant: 'success' });
  }, [enqueueSnackbar]);

  return (
    <Box ref={ref} id="nightbot">
      <Typography variant="h2" sx={{ pb: 2 }}>
        Nightbot
      </Typography>
      <Paper elevation={1} sx={{ p: 1 }}>
        {userLoadInProgress}
        <TextField
          disabled
          fullWidth
          variant="filled"
          value={userLoadInProgress ? 'Loading user data...' : user}
          label={translate('integrations.lastfm.settings.username')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {user !== 'Not Authorized' ? (
                  <Button color="error" variant="contained" onClick={revoke}>
                    Revoke
                  </Button>
                ) : (
                  <Button
                    color="success"
                    variant="contained"
                    onClick={authorize}
                  >
                    Authorize
                  </Button>
                )}
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          <Button
            fullWidth
            color="primary"
            variant="contained"
            disabled={user === 'Not Authorized'}
            onClick={() => importPlaylist(accessToken)}
          >
            Import playlist
          </Button>
          <Button
            fullWidth
            color="primary"
            variant="contained"
            disabled={user === 'Not Authorized'}
            onClick={() => importCustomCommands(accessToken)}
          >
            Import commands
          </Button>
          <Button
            fullWidth
            color="primary"
            variant="contained"
            disabled={user === 'Not Authorized'}
            onClick={() => importTimers(accessToken)}
          >
            Import timers
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PageSettingsModulesImportNightbot;
