import {
  AppBar, Box, Fade, Grid, Slide, Toolbar,
} from '@mui/material';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import { setUseWhatChange } from '@simbathesailor/use-what-changed';
import axios from 'axios';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce, useRefElement } from 'rooks';

import { Logo } from '@/components/AppBar/Logo';
import { OnboardingTokens } from '@/components/Dialog/OnboardingTokens';
import { ServerSelect } from '@/components/Dialog/ServerSelect';
import { AppBarBreadcrumbs } from '~/src/components/AppBar/Breadcrumbs';
import { Search } from '~/src/components/AppBar/Search';
import { LoginWarning } from '~/src/components/Dialog/LoginWarning';
import { setLocale } from '~/src/helpers/dayjsHelper';
import { getListOf, populateListOf } from '~/src/helpers/getListOf';
import { isUserLoggedIn } from '~/src/helpers/isUserLoggedIn';
import { getConfiguration, getSocket } from '~/src/helpers/socket';
import { setScrollY } from '~/src/store/pageSlice';

import checkTokenValidity from '../../helpers/check-token-validity';
import {
  setConfiguration, setMessage, setState, setSystem, setTranslation, showLoginWarning,
} from '../../store/loaderSlice';
import { setUser } from '../../store/userSlice';
import CookieBar from '../CookieBar/CookieBar';
import { DashboardStats } from '../Dashboard/Stats';
import { DashboardWidgetAction } from '../Dashboard/Widget/Action';
import { DashboardWidgetBot } from '../Dashboard/Widget/Bot';
import { DashboardWidgetTwitch } from '../Dashboard/Widget/Twitch';
import NavDrawer from '../navDrawer';

setUseWhatChange(process.env.NODE_ENV === 'development');

const botInit = async (dispatch: Dispatch<AnyAction>, server: null | string, connectedToServer: boolean) => {
  if (!server || !connectedToServer) {
    setTimeout(() => {
      botInit(dispatch, server, connectedToServer);
    }, 100);
    return;
  }

  dispatch(setState(false));

  try {
    const headers = {
      'x-twitch-token':  localStorage.code,
      'x-twitch-userid': localStorage.userId,
    };
    const validation = await axios.get(`${sessionStorage.serverUrl}/socket/validate`, { headers });
    console.group('isUserLoggedIn::bot::validation');
    console.debug(JSON.stringify({
      validation, headers,
    }));
    console.groupEnd();
    localStorage[`${localStorage.currentServer}::accessToken`] = validation.data.accessToken;
    localStorage[`${localStorage.currentServer}::refreshToken`] = validation.data.refreshToken;
    localStorage[`${localStorage.currentServer}::userType`] = validation.data.userType;
  } catch(e) {
    dispatch(showLoginWarning());
    dispatch(setMessage('You don\'t have access to this server.'));
    return;
  }

  dispatch(setUser(await isUserLoggedIn()));

  await populateListOf('core');
  await populateListOf('systems');
  await populateListOf('services');
  await populateListOf('integrations');

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

  const configuration = await getConfiguration();
  dispatch(setConfiguration(configuration));

  // translations hydration
  await new Promise<void>(resolve => {
    getSocket('/', true).emit('translations', (translations) => {
      dispatch(setTranslation(translations));
      resolve();
    });
  });

  setLocale(configuration.lang as string);

  await populateListOf('core');
  await populateListOf('systems');
  await populateListOf('services');
  await populateListOf('integrations');

  checkTokenValidity();

  dispatch(setState(true));
};

export const Layout: React.FC<{ children: any }> = (props) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { server, connectedToServer, state, tokensOnboardingState } = useSelector((s: any) => s.loader);
  const [ isIndexPage, setIndexPage ] = useState(false);

  useEffect(() => {
    setIndexPage(router.route === '/');
  }, [router, dispatch]);

  useEffect(() => {
    botInit(dispatch, server, connectedToServer);
  }, [server, dispatch, connectedToServer]);

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

  return (
    <>
      <CookieBar/>
      <LoginWarning/>
      <ServerSelect/>
      {state && <>
        <OnboardingTokens/>
        <Fade in={state && tokensOnboardingState}>
          <Box sx={{ flexGrow: 1 }}>
            <Slide in={!isIndexPage}>
              <AppBar position="sticky" sx={{ px: '70px' }}>
                <Toolbar>
                  <Box sx={{ flexGrow: 1 }}>
                    <AppBarBreadcrumbs/>
                  </Box>
                  <Search/>
                  <Logo/>
                </Toolbar>
              </AppBar>
            </Slide>
            <NavDrawer />

            {state && tokensOnboardingState && <Box sx={{ paddingLeft: '65px' }}>
              <Fade in={isIndexPage}>
                <Box sx={{
                  position: 'absolute', top: '0px', width: 'calc(100% - 75px)', left: '70px',
                }} mr={0.2}>
                  <DashboardStats/>
                  <Grid container pt={0.5} pr={0.2} spacing={0.5}>
                    <Grid item sm={6} md={6} xs={12}>
                      <DashboardWidgetBot/>
                    </Grid>
                    <Grid item sm={4} md={4} xs={12}>
                      <DashboardWidgetTwitch/>
                    </Grid>
                    <Grid item sm={2} md={2} xs={12}>
                      <DashboardWidgetAction/>
                    </Grid>
                  </Grid>
                </Box>
              </Fade>

              <Fade in={!isIndexPage}>
                <Box ref={pageRef} sx={{
                  minHeight: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)', padding: '0.3em', overflow: 'auto',
                }}>
                  {props.children}
                </Box>
              </Fade>
            </Box>}
          </Box>
        </Fade>
      </>}
    </>
  );
};