import Head from 'next/head';
import { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider, EmotionCache } from '@emotion/react';
import theme from '../src/theme';
import createEmotionCache from '../src/createEmotionCache';
import '../styles/styles.css'
import BackdropLoading from '../src/components/backdropLoading';
import store from '../src/app/store'
import { Provider } from 'react-redux'
import NavDrawer from '../src/components/navDrawer';
import { Box, Typography } from '@mui/material';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <Provider store={store}>
      <CacheProvider value={emotionCache}>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <BackdropLoading/>
          <Box sx={{ display: 'flex' }}>
            <NavDrawer/>
            <Component {...pageProps} />
            <Typography paragraph variant='overline'>
              Copyright © Your Website 2022.
            </Typography>
          </Box>
        </ThemeProvider>
      </CacheProvider>
    </Provider>
  );
}
