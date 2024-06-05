import { Box, CircularProgress, Fade } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import { cloneDeep } from 'lodash';
import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import { loggedUserAtom } from '../atoms';
import { DashboardWidgetBot } from '../components/Dashboard/Widget/Bot';
import { DashboardWidgetTwitch } from '../components/Dashboard/Widget/Twitch';
import { LoginWarning } from '../components/LoginWarning';
import { ServerRouterQueryParam } from '../components/ServerRouterQueryParam';
import { ServerSelect } from '../components/ServerSelect';
import { Version } from '../components/Version';
import checkTokenValidity from '../helpers/check-token-validity';
import { setLocale } from '../helpers/dayjsHelper';
import { getListOf, populateListOf } from '../helpers/getListOf';
import { isUserLoggedIn } from '../helpers/isUserLoggedIn';
import { getConfiguration, getSocket } from '../helpers/socket';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { setConfiguration, setMessage, setState, setSystem, setTranslation, showLoginWarning } from '../store/loaderSlice';
import theme from '../theme';

axios.defaults.baseURL = JSON.parse(localStorage.server);

const botInit = async (dispatch: Dispatch<AnyAction>, server: null | string, connectedToServer: boolean, setUser: any) => {
  if (!server || !connectedToServer) {
    setTimeout(() => {
      botInit(dispatch, server, connectedToServer, setUser);
    }, 100);
    return;
  }

  dispatch(setState(false));

  try {
    const headers = {
      'x-twitch-token':  localStorage.code,
      'x-twitch-userid': localStorage.userId,
    };
    console.group('isUserLoggedIn::bot::validation');
    console.debug(JSON.stringify({ headers }));
    const validation = await axios.get(`${localStorage.serverUrl}/socket/validate`, { headers });
    console.debug(JSON.stringify({ validation }));
    console.groupEnd();
    localStorage[`${localStorage.server}::accessToken`] = validation.data.accessToken;
    localStorage[`${localStorage.server}::refreshToken`] = validation.data.refreshToken;
    localStorage[`${localStorage.server}::userType`] = validation.data.userType;
  } catch(e) {
    console.error(e);
    console.groupEnd();
    dispatch(showLoginWarning());
    dispatch(setMessage('You don\'t have access to this server.'));
    return;
  }

  console.log('Waiting for user data.');
  setUser(await isUserLoggedIn());

  console.log('Populating systems.');
  await populateListOf('core');
  await populateListOf('systems');
  await populateListOf('services');
  await populateListOf('integrations');

  console.log('Dispatching systems.');
  dispatch(setSystem({
    type: 'core', value: cloneDeep(getListOf('core')),
  }));
  dispatch(setSystem({
    type: 'services', value: cloneDeep(getListOf('services')),
  }));
  dispatch(setSystem({
    type: 'systems', value: cloneDeep(getListOf('systems')),
  }));
  dispatch(setSystem({
    type: 'integrations', value: cloneDeep(getListOf('integrations')),
  }));

  console.log('Populating configuration.');
  const configuration = await getConfiguration();
  console.log('Dispatching configuration.');
  dispatch(setConfiguration(configuration));

  // translations hydration
  console.log('Populating translations.');
  await new Promise<void>(resolve => {
    getSocket('/').emit('translations', (translations: any) => {
      console.log('Dispatching translations.');
      dispatch(setTranslation(translations));
      resolve();
    });
  });

  setLocale(configuration.lang as string);

  console.log('Checking token validity');
  checkTokenValidity();

  console.log('Dispatching bot state OK.');
  dispatch(setState(true));
};

export default function Root() {
  const dispatch = useAppDispatch();
  const { server, connectedToServer, state, configuration } = useAppSelector((s: any) => s.loader);
  const setUser = useSetAtom(loggedUserAtom);

  useEffect(() => {
    botInit(dispatch, server, connectedToServer, setUser);
  }, [server, dispatch, connectedToServer, setUser]);

  return <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={configuration.lang}>
    <ServerSelect passive/>
    <Version/>
    <LoginWarning/>
    <ServerRouterQueryParam/>

    <Fade in={state}>
      <Box>
        { state && <Routes>
          <Route path="/widget/bot/" element={<DashboardWidgetBot/>}/>
          <Route path="/widget/chat/" element={<DashboardWidgetTwitch/>}/>
        </Routes>}
      </Box>
    </Fade>
    <Fade in={!state}>
      <Box sx={{
        position:       'absolute',
        width:          '100vw',
        height:         '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        top:            0,
        left:           0,
      }}>
        <CircularProgress color="inherit" sx={{ color: theme.palette.primary.main }} />
      </Box>
    </Fade>
  </LocalizationProvider>;
}
