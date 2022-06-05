import { useDispatch, useSelector } from 'react-redux';
import BackdropLoading from '../src/components/backdropLoading';
import NavDrawer from '../src/components/navDrawer';
import { Box, AppBar, Toolbar, Avatar, Badge } from '@mui/material';
import { AppProps } from 'next/app';
import TwitchEmbed from './components/twitchEmbed';
import theme from './theme';
import Image from 'next/image'
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { disableSearch, } from './store/searchSlice';
import { Search } from './components/search';
import { BrowserView, isMobile, MobileView } from 'react-device-detect';

export default function Layout(props: AppProps) {
  const router = useRouter();
  const dispatch = useDispatch();

  let [lastPath, setLastPath] = useState('/')

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
              <Badge badgeContent={'public'} color="primary" invisible={isMobile}

                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}>
                <a href="https://sogebot.xyz" target={'_blank'} rel="noreferrer">
                <MobileView>
                  <Image src={"/public/static/sogebot_small.png"} width={40} height={25} />
                  </MobileView>
                  <BrowserView>
                  <Image src={"/public/static/sogebot_large.png"} width={190} height={25} />
                  </BrowserView>
                </a>
              </Badge>
          </Box>

          <Search/>

          <Avatar alt="Sogeking!" src="https://i.pravatar.cc/32" />
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