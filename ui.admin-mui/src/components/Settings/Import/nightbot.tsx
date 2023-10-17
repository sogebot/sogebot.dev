import {
  Box, Button, CircularProgress, Container, InputAdornment, Paper, TextField, Typography,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { useLocalstorageState, useRefElement } from 'rooks';

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

  const importPlaylist = async () => {
    const firstUrl = new URL(`https://api.nightbot.tv/1/song_requests/playlist?offset=0&limit=100`);
    // NOTE: key is the name of the path entry to the resource we want
    //       For just the playlist, this is fine. If we add more resources
    //       this key will need to be dynamic
    const key = 'playlist';

    // NOTE: This is a type error that I need help with
    const fetchResource = async (acc: [], url: URL) => {
      const page = await axios.get(url.href, { headers: { Authorization: 'Bearer ' + accessToken } });
      // NOTE: total number of items in the resource
      // NOTE: I think a default of 1 is safe, to ensure requesting exactly 1 page of data
      //       Default of zero can result in infinitely looping -> Error 429
      //       That may be a problem somewhere else instead of here
      // const total = page.data._total ? page.data._total : 1;
      // NOTE: Hardcoding this just because my playlist is over 1,000 songs
      const total = 300;

      // NOTE: Resources with multiple items are returned in an array
      //       We need to spread it to prevent nesting arrays in our accumulated result
      // NOTE: This breaks if the endpoint returns a single item, such as `/me`
      // NOTE: this is a type error that I need help with
      acc.push(...page.data[key]);

      if (acc.length >= total) {
        // NOTE: We probably need just the "track" key
        //       There is some other metadata like createdAt. Maybe
        //       useful for some sorting/filtering by the end user if
        //       they want to preserve the original order of additions
        return acc.map(e => e.track);
      }

      // NOTE: This may not be necessary to calculate by converting between types, if
      //       we don't use the `new URL()` constructor.
      const currentOffset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || 0);
      const newOffset = currentOffset + limit;
      // NOTE: Setting the search/query params could be done by just building a url as a string
      //       I ended up with this mostly because I don't know how to use the type system well yet
      url.searchParams.set('offset', newOffset.toString());

      return await fetchResource(acc, url);
    };

    setPlaylist(await fetchResource([], firstUrl));
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
          <Button color="primary" variant="contained" onClick={importPlaylist}>Import</Button>
          <pre>{JSON.stringify(playlist, null, 2)}</pre>
        </Container>

      </Paper>
    </Box>
  );
};

export default PageSettingsModulesImportNightbot;
