import { useDispatch, useSelector } from 'react-redux';
import BackdropLoading from '../src/components/backdropLoading';
import NavDrawer from '../src/components/navDrawer';
import { Box, AppBar, Toolbar, Badge } from '@mui/material';
import { AppProps } from 'next/app';
import TwitchEmbed from './components/twitchEmbed';
import theme from './theme';
import Image from '../src/components/image'
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { disableSearch, } from './store/searchSlice';
import { Search } from './components/search';
import { BrowserView, isMobile, MobileView } from 'react-device-detect';
import { isUserLoggedIn } from '@sogebot/ui-helpers/isUserLoggedIn'
import { setUser } from './store/userSlice';
import { UserMenu } from './components/userMenu';
import { setLocale } from '@sogebot/ui-helpers/dayjsHelper';
import { setConfiguration } from './store/loaderSlice';
import { getConfiguration, getTranslations } from './socket';

import sogebotLarge from '../public/sogebot_large.png';
import sogebotSmall from '../public/sogebot_small.png';

export default function Layout(props: AppProps) {
  const router = useRouter();
  const dispatch = useDispatch();

  let [lastPath, setLastPath] = useState('/')

  useEffect(() => {
    getTranslations()
    getConfiguration().then(data => {
      dispatch(setConfiguration(data));
      setLocale(data.lang as string);
    });

    isUserLoggedIn(false, false)
      .then((user) => {
        dispatch(setUser(user))
      })
  }, [dispatch])

  useEffect(() => {
    if (lastPath !== router.asPath) {
    setLastPath(router.asPath);
      dispatch(disableSearch())
    }
  }, [dispatch, router])

  const { state } = useSelector((state: any) => state.loader);
  const { Component, pageProps } = props;

  return (
    <>{!state && <BackdropLoading />}
      {state &&  <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1}}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Badge
              badgeContent={'public'}
              color="primary"
              invisible={isMobile}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}>
              <a href="https://sogebot.xyz" target={'_blank'} rel="noreferrer">
              <MobileView>
                <Image src={sogebotSmall} width={40} height={25} />
              </MobileView>
              <BrowserView>
                <Image src={sogebotLarge} width={190} height={25} />
              </BrowserView>
              </a>
            </Badge>
          </Box>

          <Search/>

          <UserMenu/>
        </Toolbar>
      </AppBar>
      <NavDrawer />

      <Box sx={{ paddingLeft:'72px'}}>
        <TwitchEmbed/>
        <Box sx={{ maxHeight:'calc(100vh - 65px)', overflow: 'auto', maxWidth:'calc(100vw - 65px)' }}>
          <Component  {...pageProps} />
        </Box>
      </Box>
    </Box>}</>
  );
}