import {
  Box, Button, CircularProgress, Container, InputAdornment, Paper, TextField, Typography,
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

  const [playlist, setPlaylist] = React.useState([]);

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

  type ApiResponse = {
    status: number;
    _sort: { 'date': 'asc' | 'desc' };
    _limit: number;
    _offset: number;
    _total: number;
    playlist: PlaylistItem[];
  };

  const fetchPlaylist = async () => {
    // NOTE: This sets up a way to cancel requests
    const controller = new AbortController();
    const ax = axios.create({
      signal:  controller.signal,
      headers: { Authorization: 'Bearer ' + accessToken },
    });

    // NOTE: This attempts to jump in when the request is bad
    //       Do NOT handle 429 like this? Just self-impose rate limits?
    ax.interceptors.request.use((config) => {
      return config;
    }, (error) => {
      enqueueSnackbar('Something went wrong.', { variant: 'error' });
      console.log('[Bad request] - ', error);
      // NOTE: Isn't it too late to abort here because by now we already
      //       have an error response to handle instead?
      //       The desire is to cascade through any pending requests
      //       and abort them all, but I don't think this works
      controller.abort();
      return Promise.reject(error);
    });

    // NOTE: key is the name of the path entry to the resource we want
    //       For just the playlist, this is fine. If we add more resources
    //       this key will need to be dynamic
    const key = 'playlist';

    const fetchResource = async (acc: PlaylistItemTrack[], offset: number): Promise<T> => {
      // NOTE: This breaks on any other endpoint now
      // NOTE: We probably could dispatch to a handler on the `key` aka the resource type
      const response = await ax.get('https://api.nightbot.tv/1/song_requests/playlist?limit=100&offset='+offset, {
        signal:  controller.signal,
        headers: { Authorization: 'Bearer ' + accessToken },
      });

      // NOTE: This appeases the type checker when mapping over `data[key]`
      const data: ApiResponse = response.data;

      // NOTE: I think a default of 0 is safe, to ensure requesting exactly 1 page of data
      const total = data._total ?? 0;

      // NOTE: Resources with multiple items are returned in an array
      //       Fix this if we expand the importer to other endpoints
      const tracks = data[key].map((e) => e.track);

      // TODO: I'd prefer not to mutate this accumulator in-place
      if (acc.push(...tracks) >= total) {
        return acc;
      }

      return await fetchResource(acc, offset + 100);
    };

    const pl = await fetchResource([], 0);
    setPlaylist(pl);

    return pl;
  };

  const importPlaylist = async () => {
    // TODO: `fetchPlaylist` should probably just return the simplified array of IDs
    const videos: PlaylistItemTrack[] = await fetchPlaylist();

    videos.filter((track) => {
      // TODO: Nightbot supports SoundCloud also
      //       Should we cover that case?
      track.provider === 'youtube'
    }).forEach(async (video) => {
      await new Promise((resolve, reject) => {
        getSocket('/systems/songs').emit(
          'import.video',
          {
            playlist:  video.providerId,
            forcedTag: 'nightbot-import',
          },
          (err) => {
            if (err) {
              // FIXME: This could potentially generate
              //        hundreds of notifications.
              // enqueueSnackbar('Video failed to import.', { variant: 'error' });
              // TODO: The `filter()` above prevents us getting here on my playlist
              console.error('error: ', video.url );
              reject(err);
            } else {
              resolve('resolved');
            }
          },
        );
      });
    });
    // TODO: We just assume overall success, since no error is thrown
    enqueueSnackbar('Playlist import succeeded.', { variant: 'success' });
  };

  return (
    <Box ref={ref} id="nightbot">
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
            startAdornment: userLoadInProgress && <InputAdornment position="start"><CircularProgress size={20}/></InputAdornment>,
            endAdornment:   <InputAdornment position="end">
              { user !== 'Not Authorized'
                ? <Button color="error" variant="contained" onClick={revoke}>Revoke</Button>
                : <Button color="success" variant="contained" onClick={authorize}>Authorize</Button>
              }
            </InputAdornment>,
          }}
        />
        <Container>
          <Button color="primary" variant="contained" disabled={user === 'Not Authorized'} onClick={importPlaylist}>Import</Button>
          <pre>{JSON.stringify(playlist, null, 2)}</pre>
        </Container>

      </Paper>
    </Box>
  );
};

export default PageSettingsModulesImportNightbot;
