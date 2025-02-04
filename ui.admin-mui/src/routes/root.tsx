import { AppBar, Backdrop, Box, CircularProgress, Fade, Grid, Slide, Toolbar } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import { cloneDeep } from 'lodash';
import React, { Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useDebounce, useLocalstorageState, useRefElement } from 'rooks';

import Error404 from './404';
import { loggedUserAtom } from '../atoms';
import PageCommandsAlias from './commands/alias';
import PageCommandsAliasGroup from './commands/aliasGroup';
import PageCommandsBot from './commands/botcommands';
import PageCommandsCooldowns from './commands/cooldowns';
import PageCommandsCustomCommands from './commands/customcommands';
import PageCommandsCustomCommandsGroup from './commands/customcommandsGroup';
import PageCommandsKeywords from './commands/keywords';
import PageCommandsKeywordsGroup from './commands/keywordsGroup';
import PageCommandsPrice from './commands/price';
import PageManageEvents from './manage/events';
import PageManageHighlights from './manage/highlights';
import PageManageHLTB from './manage/howlongtobeat';
import PageManageQuotes from './manage/quotes';
import PageManageRanks from './manage/ranks';
import PageManageBannedSongsSpotify from './manage/spotify/bannedsongs';
import PageManageTimers from './manage/timers';
import PageManageViewers from './manage/viewers';
import PageManageBannedSongs from './manage/youtube/bannedsongs';
import PageManagePlaylist from './manage/youtube/playlist';
import PageRegistryCustomVariables from './registry/customvariables';
import PageRegistryGallery from './registry/gallery';
import PageRegistryOBSWebsocket from './registry/obswebsocket';
import PageRegistryOverlays from './registry/overlays';
import PageRegistryPlugins from './registry/plugins';
import PageRegistryRandomizer from './registry/randomizer';
import PageSettingsModules from './settings/modules';
import PageSettingsPermissions from './settings/permissions';
import PageSettingsTranslations from './settings/translations';
import PageStatsBits from './stats/bits';
import PageStatsCommandCount from './stats/commandcount';
import PageStatsProfiler from './stats/profiler';
import PageStatsTips from './stats/tips';
import { AppBarBreadcrumbs } from '../components/AppBar/Breadcrumbs';
import { Logo } from '../components/AppBar/Logo';
import CookieBar from '../components/CookieBar';
import { DashboardStats } from '../components/Dashboard/Stats';
import { DashboardWidgetAction } from '../components/Dashboard/Widget/Action';
import { DashboardWidgetBot } from '../components/Dashboard/Widget/Bot';
import { DashboardWidgetTwitch } from '../components/Dashboard/Widget/Twitch';
import DebugBar from '../components/DebugBar';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoginWarning } from '../components/LoginWarning';
import NavDrawer from '../components/NavDrawer/navDrawer';
import { OnboardingTokens } from '../components/OnboardingTokens';
import { ServerRouterQueryParam } from '../components/ServerRouterQueryParam';
import { ServerSelect } from '../components/ServerSelect';
import { Version } from '../components/Version';
import checkTokenValidity from '../helpers/check-token-validity';
import { setLocale } from '../helpers/dayjsHelper';
import { getListOf, populateListOf } from '../helpers/getListOf';
import { isUserLoggedIn } from '../helpers/isUserLoggedIn';
import { getConfiguration, getTranslations } from '../helpers/socket';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import useMobile from '../hooks/useMobile';
import { useScope } from '../hooks/useScope';
import { setConfiguration, setMessage, setState, setSystem, setTranslation, showLoginWarning } from '../store/loaderSlice';
import { setScrollY } from '../store/pageSlice';

const botInit = async (dispatch: Dispatch<AnyAction>, server: null | string, connectedToServer: boolean, setUser: any) => {
  if (!server || !connectedToServer) {
    setTimeout(() => {
      botInit(dispatch, server, connectedToServer, setUser);
    }, 100);
    return;
  }

  axios.defaults.baseURL = JSON.parse(localStorage.server);

  // Add a response interceptor to the default Axios instance
  axios.interceptors.response.use(
    response => {
    // If the response is successful, simply return the response
      return response;
    },
    error => {
    // If the response has an error
      if (error.response && error.response.status === 403) {
      // Handle 403 error globally
        console.error('Global Error Handler: Error 403 - Forbidden');
      }

      // Return a rejected promise to keep the promise chain
      return Promise.reject(error);
    }
  );

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

    axios.defaults.headers.common.Authorization = `Bearer ${validation.data.accessToken}`;
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
  console.log('Dispatching configuration.', JSON.stringify(configuration));
  dispatch(setConfiguration(configuration));

  // translations hydration
  console.log('Populating translations.');
  const translations = await getTranslations();
  console.log('Dispatching translations.', JSON.stringify(translations));
  dispatch(setTranslation(translations));

  setLocale(configuration.lang as string);

  console.log('Checking token validity');
  checkTokenValidity();

  console.log('Dispatching bot state OK.');
  dispatch(setState(true));
};

export default function Root() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { server, connectedToServer, state, configuration } = useAppSelector((s: any) => s.loader);
  const [ isIndexPage, setIndexPage ] = useState(false);
  const isMobile = useMobile();
  const setUser = useSetAtom(loggedUserAtom);

  const [ unfold ] = useLocalstorageState(`${localStorage.server}::action_unfold`, true);
  const [ chatUnfold ] = useLocalstorageState(`${localStorage.server}::chat_unfold`, true);
  const scope = useScope('dashboard');

  useEffect(() => {
    setIndexPage(location.pathname === '/');
  }, [location.pathname, dispatch]);

  useEffect(() => {
    botInit(dispatch, server, connectedToServer, setUser);
  }, [server, dispatch, connectedToServer, setUser]);

  const [pageRef, element]  = useRefElement<HTMLElement>();
  const throttledFunction = useDebounce((el: HTMLElement) => {
    dispatch(setScrollY(el.scrollTop));
  }, 100, { trailing: true });

  useEffect(() => {
    if (element) {
      element.addEventListener('scroll', () => {
        throttledFunction(element);
      }, { passive: true });
    }
  }, [ element, dispatch, throttledFunction ]);
  return <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={configuration.lang}>
    <ErrorBoundary>
      <ServerSelect/>
      <Version/>
      <LoginWarning/>
      <CookieBar/>
      <DebugBar/>
      <ServerRouterQueryParam/>

      {state && <>
        <OnboardingTokens/>
        <Fade in={state}>
          <Box sx={{ flexGrow: 1 }}>
            <Slide in={!isIndexPage}>
              <AppBar position="sticky" sx={{ px: '70px' }}>
                <Toolbar>
                  <Box sx={{ flexGrow: 1 }}>
                    <AppBarBreadcrumbs/>
                  </Box>
                  <Logo/>
                </Toolbar>
              </AppBar>
            </Slide>
            <NavDrawer />
            {state && <Box sx={{ paddingLeft: isMobile ? undefined : '65px' }}>
              <Fade in={isIndexPage}>
                <Box sx={{
                  position: 'absolute', top: '0px', width: isMobile ? '100%' : 'calc(100% - 75px)', left: isMobile ? undefined : '70px',
                }} mr={0.2}>
                  <DashboardStats/>
                  <Grid container pt={0.5} pr={0.2} spacing={0.5} sx={{
                    flexFlow: 'nowrap', minWidth: 0,
                  }}>
                    <Grid item
                      sx={{ minWidth: 0 }}
                      sm={chatUnfold ? 12 : true}
                      md={chatUnfold ? 6 : true}
                      xs={chatUnfold ? 12 : true}>
                      <DashboardWidgetBot/>
                    </Grid>
                    <Grid item
                      sx={{ minWidth: 0 }}
                      sm={chatUnfold ? true : 'auto'}
                      md={chatUnfold ? true : 'auto'}
                      xs={chatUnfold ? true : 'auto'}>
                      <DashboardWidgetTwitch/>
                    </Grid>
                    {scope.manage && <Grid item
                      sm={unfold ? 2 : 'auto'}
                      md={unfold ? 2 : 'auto'}
                      xs={unfold ? 12 : 'auto'}
                      sx={{ minWidth: unfold ? '180px' : 0 }}>
                      <DashboardWidgetAction/>
                    </Grid>}
                  </Grid>
                </Box>
              </Fade>

              <Fade in={!isIndexPage}>
                <Box ref={pageRef} sx={{
                  minHeight: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)', padding: '0.3em', overflow: 'auto',
                }}>
                  <Suspense fallback={<Backdrop open={true}>
                    <CircularProgress/>
                  </Backdrop>}>
                    <Routes>
                      <Route path="/commands/alias/group/:type?/:id?" element={<PageCommandsAliasGroup/>}/>
                      <Route path="/commands/alias/:type?/:id?" element={<PageCommandsAlias/>}/>
                      <Route path="/commands/botcommands/:type?/:id?" element={<PageCommandsBot/>}/>
                      <Route path="/commands/price/:type?/:id?" element={<PageCommandsPrice/>}/>
                      <Route path="/commands/cooldowns/:type?/:id?" element={<PageCommandsCooldowns/>}/>
                      <Route path="/commands/keywords/group/:type?/:id?" element={<PageCommandsKeywordsGroup/>}/>
                      <Route path="/commands/keywords/:type?/:id?" element={<PageCommandsKeywords/>}/>
                      <Route path="/commands/customcommands/group/:type?/:id?" element={<PageCommandsCustomCommandsGroup/>}/>
                      <Route path="/commands/customcommands/:type?/:id?" element={<PageCommandsCustomCommands/>}/>

                      <Route path="/manage/events/:type?/:id?" element={<PageManageEvents/>}/>
                      <Route path="/manage/quotes/:type?/:id?" element={<PageManageQuotes/>}/>
                      <Route path="/manage/timers/:type?/:id?" element={<PageManageTimers/>}/>
                      <Route path="/manage/viewers/:userId?" element={<PageManageViewers/>}/>
                      <Route path="/manage/highlights" element={<PageManageHighlights/>}/>
                      <Route path="/manage/ranks/:type?/:id?" element={<PageManageRanks/>}/>
                      <Route path="/manage/howlongtobeat/:type?/:id?" element={<PageManageHLTB/>}/>
                      <Route path="/manage/songs/playlist/:type?/:id?" element={<PageManagePlaylist/>}/>
                      <Route path="/manage/songs/bannedsongs/" element={<PageManageBannedSongs/>}/>
                      <Route path="/manage/spotify/bannedsongs/" element={<PageManageBannedSongsSpotify/>}/>

                      <Route path="/settings/modules/:type/:id?" element={<PageSettingsModules/>}/>
                      <Route path="/settings/permissions/:type?/:id?" element={<PageSettingsPermissions/>}/>
                      <Route path="/settings/translations/:type?/:id?" element={<PageSettingsTranslations/>}/>

                      <Route path="/registry/obswebsocket/:type?/:id?" element={<PageRegistryOBSWebsocket/>}/>
                      <Route path="/registry/overlays/:type?/:id?" element={<PageRegistryOverlays/>}/>
                      <Route path="/registry/randomizer/:type?/:id?" element={<PageRegistryRandomizer/>}/>
                      <Route path="/registry/plugins/:type?/:id?" element={<PageRegistryPlugins/>}/>
                      <Route path="/registry/customvariables/:type?/:id?" element={<PageRegistryCustomVariables/>}/>
                      <Route path="/registry/gallery" element={<PageRegistryGallery/>}/>

                      <Route path="/stats/bits" element={<PageStatsBits/>}/>
                      <Route path="/stats/tips" element={<PageStatsTips/>}/>
                      <Route path="/stats/commandcount" element={<PageStatsCommandCount/>}/>
                      <Route path="/stats/profiler" element={<PageStatsProfiler/>}/>

                      <Route path="/" element={<span/>} errorElement={<ErrorBoundary />}/>
                      <Route path="*" element={<Error404/>}/>
                    </Routes>
                  </Suspense>
                </Box>
              </Fade>
            </Box>}
          </Box>
        </Fade>
      </>}
    </ErrorBoundary>
  </LocalizationProvider>;
}
