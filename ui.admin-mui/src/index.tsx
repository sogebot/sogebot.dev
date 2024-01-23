import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ConfirmProvider } from 'material-ui-confirm';
import { SnackbarProvider } from 'notistack';
import React, { lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const Credentials = lazy(() => import('./routes/credentials'));
const Popout = lazy(() => import('./routes/popout'));
const Root = lazy(() => import('./routes/root'));
const Overlays = lazy(() => import('./routes/overlays'));
import { store } from './store/store';
import theme from './theme';

import './styles/styles.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);
console.debug('Initializing router with basename', process.env.REACT_APP_COMMIT ? `/${process.env.REACT_APP_COMMIT}` : undefined);
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
    path:    '/popout/*',
    element: <Popout/>,
  },
  {
    path:    '/*',
    element: <Root />,
  },
], { basename: process.env.REACT_APP_COMMIT ? `/${process.env.REACT_APP_COMMIT}` : undefined });

root.render(
  <SnackbarProvider maxSnack={3} autoHideDuration={1500}>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ConfirmProvider>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />

          <RouterProvider router={router}/>
        </ConfirmProvider>
      </ThemeProvider>
    </Provider>
  </SnackbarProvider>
  ,
);
