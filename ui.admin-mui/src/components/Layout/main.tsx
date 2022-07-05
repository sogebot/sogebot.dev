import {
  AppBar, Box, Fade, Grid, Slide, Toolbar,
} from '@mui/material';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import axios from 'axios';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Logo } from '@/components/AppBar/Logo';
import { ServerSelect } from '@/components/Dialog/ServerSelect';
import { AppBarBreadcrumbs } from '~/src/components/AppBar/Breadcrumbs';
import { Search } from '~/src/components/AppBar/Search';
import { setLocale } from '~/src/helpers/dayjsHelper';
import { getListOf, populateListOf } from '~/src/helpers/getListOf';
import { isUserLoggedIn } from '~/src/helpers/isUserLoggedIn';
import { getConfiguration, getTranslations } from '~/src/helpers/socket';
import { disableBulk, enableBulk } from '~/src/store/appbarSlice';

import checkTokenValidity from '../../helpers/check-token-validity';
import {
  setConfiguration, setMessage, setState, setSystem,
} from '../../store/loaderSlice';
import { setUser } from '../../store/userSlice';
import { Bulk } from '../AppBar/Bulk';
import { DashboardStats } from '../Dashboard/Stats';
import { DashboardWidgetAction } from '../Dashboard/Widget/Action';
import { DashboardWidgetBot } from '../Dashboard/Widget/Bot';
import { DashboardWidgetTwitch } from '../Dashboard/Widget/Twitch';
import NavDrawer from '../navDrawer';

const botInit = async (dispatch: Dispatch<AnyAction>, server: null | string, connectedToServer: boolean) => {
  if (!server || !connectedToServer) {
    setTimeout(() => {
      botInit(dispatch, server, connectedToServer);
    }, 100);
    return;
  }

  dispatch(setState(false));

  await new Promise<void>((resolve, reject) => {
    const headers = {
      'x-twitch-token':  localStorage.code,
      'x-twitch-userid': localStorage.userId,
    };
    axios.get(`${sessionStorage.serverUrl}/socket/validate`, { headers }).then(async (validation) => {
      console.group('isUserLoggedIn::bot::validation');
      console.debug(JSON.stringify({ validation, headers }));
      console.groupEnd();
      localStorage.accessToken = validation.data.accessToken;
      localStorage.refreshToken = validation.data.refreshToken;
      localStorage.userType = validation.data.userType;
      resolve();
    }).catch(e => {
      dispatch(setMessage('You don\'t have access to this server.'));
      reject(e);
    });
  });

  dispatch(setUser(await isUserLoggedIn()));

  await populateListOf('core');
  await populateListOf('systems');
  await populateListOf('services');
  await populateListOf('integrations');

  dispatch(setSystem({ type: 'core', value: cloneDeep(getListOf('core')) }));
  dispatch(setSystem({ type: 'services', value: cloneDeep(getListOf('services')) }));
  dispatch(setSystem({ type: 'systems', value: cloneDeep(getListOf('systems')) }));
  dispatch(setSystem({ type: 'integrations', value: cloneDeep(getListOf('integrations')) }));

  await getTranslations();

  const configuration = await getConfiguration();
  dispatch(setConfiguration(configuration));
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
  const { server, connectedToServer, state } = useSelector((s: any) => s.loader);
  const [ isIndexPage, setIndexPage ] = useState(false);

  useEffect(() => {
    setIndexPage(router.asPath === '/');

    if (router.asPath.startsWith('/commands/alias')) {
      dispatch(enableBulk());
    } else {
      dispatch(disableBulk());
    }
  }, [router, dispatch]);

  useEffect(() => {
    botInit(dispatch, server, connectedToServer);
  }, [server, dispatch, connectedToServer]);

  return (
    <>
      <ServerSelect/>
      <Fade in={state}>
        <Box sx={{ flexGrow: 1 }}>
          <Slide in={!isIndexPage}>
            <AppBar position="sticky" sx={{ px: '70px' }}>
              <Toolbar>
                <Box sx={{ flexGrow: 1 }}>
                  <AppBarBreadcrumbs/>
                </Box>
                <Bulk/>
                <Search/>
                <Logo/>
              </Toolbar>
            </AppBar>
          </Slide>
          <NavDrawer />

          {state && <Box sx={{ paddingLeft: '65px' }}>
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
              <Box sx={{
                position: 'absolute', top: '65px', maxHeight: 'calc(100vh - 65px)', overflow: 'auto', width: 'calc(100% - 75px)', left: '70px', paddingTop: '0.3em',
              }}>
                {props.children}
              </Box>
            </Fade>
          </Box>}
        </Box>
      </Fade>
    </>
  );
};