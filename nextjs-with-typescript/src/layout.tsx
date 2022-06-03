import { useSelector } from 'react-redux';
import BackdropLoading from '../src/components/backdropLoading';
import NavDrawer from '../src/components/navDrawer';
import { Box } from '@mui/material';
import { AppProps } from 'next/app';
import TwitchEmbed from './components/twitchEmbed';

export default function Layout(props: AppProps) {
  const { state } = useSelector((state: any) => state.loader);
  const { Component, pageProps } = props;

  return (
    <>{!state && <BackdropLoading />}
      {state && <Box>
      <NavDrawer />

      <Box sx={{ paddingLeft:'50px'}}>
        <TwitchEmbed/>
        <Component  {...pageProps} />
      </Box>
    </Box>}</>
  );
}