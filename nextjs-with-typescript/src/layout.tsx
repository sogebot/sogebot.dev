import { useSelector } from 'react-redux';
import BackdropLoading from '../src/components/backdropLoading';
import NavDrawer from '../src/components/navDrawer';
import { Box, AppBar, Toolbar, Avatar, Badge } from '@mui/material';
import { AppProps } from 'next/app';
import TwitchEmbed from './components/twitchEmbed';
import { useRouter } from 'next/router';
import theme from './theme';
import Image from 'next/image'

export default function Layout(props: AppProps) {
  const { state } = useSelector((state: any) => state.loader);
  const { Component, pageProps } = props;

  return (
    <>{!state && <BackdropLoading />}
      {state &&  <Box sx={{ flexGrow: 1 }}>
      <AppBar  position="sticky" elevation={5} sx={{ zIndex: theme.zIndex.drawer + 1}}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Badge badgeContent={'public'} color="primary"
  anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
  }}>
              <Image src={"/public/static/sogebot_large.png"} width={190} height={25} />
            </Badge>
          </Box>

            <Avatar alt="Sogeking!" src="https://i.pravatar.cc/32" />
        </Toolbar>
      </AppBar>
      <NavDrawer />

      <Box sx={{ paddingLeft:'72px'}}>
        <TwitchEmbed/>
        <Component  {...pageProps} />
      </Box>
    </Box>}</>
  );
}