import {
  Box, Button, InputAdornment, Paper, Stack, TextField, Typography,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { useLocalstorageState, useRefElement } from 'rooks';

import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesImportNightbot: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const [ user, setUser ] = React.useState('Not Authorized');
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const [ accessToken, setAccessToken ] = useLocalstorageState<null | string>('nightbot::accessToken', null);
  const [ userLoadInProgress, setUserLoadInProgress ] = React.useState(false);

  React.useEffect(() => {
    async function getUserData () {
      if (!accessToken) {
        return;
      }
      setUserLoadInProgress(true);
      const response = await axios.get('https://api.nightbot.tv/1/me', { headers: { Authorization: 'Bearer ' + accessToken } });
      if (response.status !== 200) {
        setAccessToken(null);
      } else {
        setUser(`${response.data.user.displayName}#${response.data.user._id}`);
      }
      setUserLoadInProgress(false);
    }
    getUserData();
  }, [ accessToken ]);

  const authorize = React.useCallback(() => {
    const popup = window.open((process.env.PUBLIC_URL !== '/' ? window.location.origin + '/' : process.env.PUBLIC_URL) + 'credentials/nightbot', 'popup', 'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no');
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [ enqueueSnackbar ]);

  const revoke = React.useCallback(() => {
    setAccessToken(null);
    setUser('Not Authorized');
    enqueueSnackbar('User access revoked.', { variant: 'success' });
  }, [ enqueueSnackbar ]);

  type PlaylistItemTrack = {
    providerId: string;
    provider: string;
    duration: number;
    title: string;
    artist: string;
    url: string;
  };

  type PlaylistItem = {
    track: PlaylistItemTrack;
    _id: string;
    createdAt: string;
    updatedAt: string;
  };

  type PlaylistPage = {
    status: number;
    _sort: { date: 'asc' | 'desc' };
    _limit: number;
    _offset: number;
    _total: number;
    playlist: PlaylistItem[];
  };

  const fetchPlaylist = async (acc: PlaylistItemTrack[], offset: number): Promise<T> => {
    const url = 'https://api.nightbot.tv/1/song_requests/playlist?limit=100&offset=';
    let maxRetries = 3;

    try {
      const response = await axios.get(url + offset, { headers: { Authorization: 'Bearer ' + accessToken } });
      const data: PlaylistPage = response.data;
      const tracks = data.playlist.map((e) => e.track);

      if (acc.push(...tracks) >= data._total ?? 0) {
        return acc;
      }

      return await fetchPlaylist(acc, offset + 100);
    } catch (error: any) {
      if (error.response.status === 429 && maxRetries !== 0) {
        maxRetries -= 1;
        console.error('Received a 429 error. Retrying after a delay...');
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(axios.get(url+offset, { headers: { Authorization: 'Bearer ' + accessToken } }));
          }, 1000);
        });
      } else if (error.response.status >= 500 && error.response.status < 600) {
        enqueueSnackbar('Remote server error.', { variant: 'error' });
        console.error(`Error === ${error.response.status}`);
      } else {
        enqueueSnackbar('Remote server error.', { variant: 'error' });
        console.error(`Error !== 429 or 5XX: ${error.response.status}`);
      }
    }
  };

  const importPlaylist = async () => {
    const videos: PlaylistItemTrack[] = await fetchPlaylist([], 0);
    const ytVideos = videos.filter((track) => {
      track.provider === 'youtube';
    });

    let failCount = 0;
    for (const video of ytVideos) {
      await new Promise((resolve, reject) => {
        getSocket('/systems/songs').emit(
          'import.video',
          {
            playlist:  video.providerId,
            forcedTag: 'nightbot-import',
          },
          (err) => {
            if (err) {
              failCount += 1;
              console.error('error: ', video.url);
              reject(err);
            } else {
              resolve('resolved');
            }
          },
        );
      });
    }

    if (failCount > 0) {
      enqueueSnackbar(`${failCount} videos failed to import.`, { variant: 'error' });
    }

    enqueueSnackbar('Playlist import completed.', { variant: 'success' });
  };

  return (
    <Box ref={ref} id='nightbot'>
      <Typography variant='h2' sx={{ pb: 2 }}>Nightbot</Typography>
      <Paper elevation={1} sx={{ p: 1 }}>
        {userLoadInProgress}
        <TextField
          disabled
          fullWidth
          variant='filled'
          value={userLoadInProgress ? 'Loading user data...' : user}
          label={translate('integrations.lastfm.settings.username')}
          InputProps={{
            endAdornment: <InputAdornment position='end'> { user !== 'Not Authorized'
              ? <Button color='error' variant='contained' onClick={revoke}>Revoke</Button>
              : <Button color='success' variant='contained' onClick={authorize}>Authorize</Button>
            }
            </InputAdornment>,
          }}
        />
        <Stack direction='row-reverse'>
          <Button color='primary' variant='contained' disabled={user === 'Not Authorized'} onClick={importPlaylist}>Import</Button>
        </Stack>

      </Paper>
    </Box>
  );
};

export default PageSettingsModulesImportNightbot;
