import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import React, { lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const Credentials = lazy(() => import('./routes/credentials'));
const Root = lazy(() => import('./routes/root'));
const Overlays = lazy(() => import('./routes/overlays'));
import { store } from './store/store';
import theme from './theme';

import './styles/styles.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);
const router = createBrowserRouter([
  {
    path:    '/credentials/*',
    element: <Credentials/>,
  },
  {
    path:    '/overlays/:base64',
    element: <Overlays/>,
  },
  {
    path:    '/*',
    element: <Root />,
  },
], { basename: process.env.PUBLIC_URL ? new URL(process.env.PUBLIC_URL).pathname : undefined });

root.render(
  <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />

        <RouterProvider router={router}/>
      </ThemeProvider>
    </Provider>
  </SnackbarProvider>
  ,
);
