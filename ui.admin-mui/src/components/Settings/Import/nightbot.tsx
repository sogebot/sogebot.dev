import { Box, Button, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
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

  type Track = {
    providerId: string;
    provider:   string;
    duration:   number;
    title:      string;
    artist:     string;
    url:        string;
  };

  type PlaylistItem = {
    track:     Track;
    _id:       string;
    createdAt: string;
    updatedAt: string;
  };

  type PlaylistResponse = {
    status:   number;
    _sort:    { date: 'asc' | 'desc' };
    _limit:   number;
    _offset:  number;
    _total:   number;
    playlist: PlaylistItem[];
  };

  const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  };

  const fetchPlaylistPage = async (offset: number): Promise<PlaylistResponse> => {
    const url = 'https://api.nightbot.tv/1/song_requests/playlist';
    const delay = 10 ** 4 * 6;
    const delaySeconds = delay / 10 ** 3;
    for (let retries = 3; retries > 0; retries--) {
      try {
        const response = await axios.get(url, {
          params: {
            limit:  100,
            offset: offset,
          },
          headers: { Authorization: 'Bearer ' + accessToken },
        });
        return response.data;
      } catch (error: any) {
        console.info(`Retrying after ${delaySeconds} seconds.`);
        await sleep(delay);
      }
    }
    console.error('Error fetching playlist page after multiple retries.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch playlist after multiple retries.');
  };

  const fetchTracks = async (tracks: Track[] = [], offset = 0): Promise<Track[]> => {
    try {
      const page = await fetchPlaylistPage(offset);
      const mergedTracks = tracks.concat(page.playlist.map(t => t.track));
      if (mergedTracks.length < page._total) {
        await fetchTracks(mergedTracks, offset + 100);
      }
      return mergedTracks;
    } catch (error: any) {
      console.error('Error fetching playlist.');
      enqueueSnackbar('Remote server error.', { variant: 'error' });
      throw new Error('Failed to fetch playlist.');
    }
  };

  const importPlaylist = async () => {
    const tracks = await fetchTracks();
    const ytVideos = tracks.filter((track) => track.provider === 'youtube');
    let failCount = 0;
    for (const track of ytVideos) {
      try {
        await new Promise((resolve, reject) => {
          getSocket('/systems/songs').emit(
            'import.video',
            {
              playlist:  track.providerId,
              forcedTag: 'nightbot-import',
            },
            (err) => {
              if (err) {
                failCount += 1;
                console.error('error: ', track.url);
                reject(err);
              } else {
                resolve('resolved');
              }
            },
          );
        });
      } catch (error) {
        console.error('ERROR DURING IMPORT: ', error);
      }
    }
    if (failCount > 0) {
      enqueueSnackbar(`${failCount} videos failed to import.`, { variant: 'info' });
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
        <Stack direction='row' sx={{
          pt: 1, textAlign: 'center',
        }}>
          <Button sx={{ width: '300px' }} color='primary' variant='contained' disabled={user === 'Not Authorized'} onClick={importPlaylist}>Import playlist</Button>
        </Stack>

      </Paper>
    </Box>
  );
};

export default PageSettingsModulesImportNightbot;
