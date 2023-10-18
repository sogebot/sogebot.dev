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

  type NightbotPlaylistVideo = {
    artist: string,
    duration: number,
    provider: string,
    providerId: string,
    title: string,
    url: string
  };

  const fetchPlaylist = async () => {
    // TODO: Increase `limit` to 100 for prod
    const firstUrl = new URL(`https://api.nightbot.tv/1/song_requests/playlist?offset=0&limit=5`);
    // NOTE: key is the name of the path entry to the resource we want
    //       For just the playlist, this is fine. If we add more resources
    //       this key will need to be dynamic
    const key = 'playlist';

    const fetchResource = async (acc: NightbotPlaylistVideo[], url: URL): Promise<T> => {
      const response = await axios.get(url.href, { headers: { Authorization: 'Bearer ' + accessToken } });
      // NOTE: total number of items in the resource
      // NOTE: I think a default of 1 is safe, to ensure requesting exactly 1 page of data
      //       Default of zero can result in infinitely looping -> Error 429
      //       That may be a problem somewhere else instead of here
      // const total = page.data._total ? page.data._total : 1;
      // NOTE: Hardcoding this just because my playlist is over 1,000 songs
      const total = 5;
      // NOTE: This may not be necessary to calculate by converting between types, if
      //       we don't use the `new URL()` constructor.
      const currentOffset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || 0);
      const newOffset = currentOffset + limit;

      switch (response.status) {
        case 200:
          // NOTE: Resources with multiple items are returned in an array
          //       We need to spread it to prevent nesting arrays in our accumulated result
          // NOTE: This breaks on any other endpoint now
          // NOTE: We probably could dispatch to a handler on the `key` aka the resource type
          acc.push(...response.data[key].map(e => e.track));

          if (acc.length >= total) {
            return acc;
          }

          // NOTE: Setting the search/query params could be done by just building a url as a string
          //       I ended up with this mostly because I don't know how to use the type system well yet
          url.searchParams.set('offset', newOffset.toString());

          return await fetchResource(acc, url);
        case 429:
          console.log('ERROR 429! - ', response.statusText);
          // TODO: This isn't really handling the error, need to look for retry-time?
          return acc;
        default:
          enqueueSnackbar('Something went wrong.', { variant: 'error' });
          // TODO: Should we cancel importing instead? Or just let the import
          //       make a best effort attempt?
          return acc;
      }
    };

    const pl =  await fetchResource([], firstUrl);
    setPlaylist(pl);

    return pl;
  };

  const importPlaylist = async () => {
    // TODO: `fetchPlaylist` should probably just return the simplified array of IDs
    const videos = await fetchPlaylist();

    videos.forEach(async (video: NightbotPlaylistVideo) => {
      console.log('video id is: ', video.providerId);
      await new Promise((resolve, reject) => {
        getSocket('/systems/songs').emit(
          'import.video',
          {
            playlist:  video.providerId,
            forcedTag: 'nightbot-import',
          },
          (err) => {
            if (err) {
              // FIXME: This seems to be unreachable.
              //        If we fix that, this could potentially generate
              //        hundreds of notifications.
              enqueueSnackbar('Video failed to import.', { variant: 'error' });
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
