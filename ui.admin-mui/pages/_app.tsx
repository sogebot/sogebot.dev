import 'simplebar-react/dist/simplebar.min.css';

import { CacheProvider, EmotionCache } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { NextPage } from 'next';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { SnackbarProvider } from 'notistack';
import { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';

import { ServerRouterQueryParam } from '~/src/components/ServerRouterQueryParam';

import store from '../src/app/store';
import createEmotionCache from '../src/createEmotionCache';
import theme from '../src/theme';

import '../styles/styles.css';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

if (typeof window !== 'undefined') {
  // Set as disabled by default
  sessionStorage.connectedToServer = false;
}

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
  Component: NextPageWithLayout;
}

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
};

export default function MyApp(props: MyAppProps) {
  const { emotionCache = clientSideEmotionCache } = props;
  const { Component, pageProps } = props;

  const getLayout = Component.getLayout || ((page) => page);

  return (
    <Provider store={store}>
      <CacheProvider value={emotionCache}>
        <Head>
          <title>sogeBot admin page</title>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>
        <SnackbarProvider maxSnack={3}>
          <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <ServerRouterQueryParam/>
            {getLayout(<Component {...pageProps} />)}
          </ThemeProvider>
        </SnackbarProvider>
      </CacheProvider>
    </Provider>
  );
}
