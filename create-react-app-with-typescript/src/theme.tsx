import grey from '@mui/material/colors/grey';
import { LinkProps } from '@mui/material/Link';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

declare module '@mui/material/styles' {
  interface Palette {
    dark: Palette['primary'];
    light: Palette['primary'];
  }
  interface PaletteOptions {
    dark: PaletteOptions['primary'];
    light: PaletteOptions['primary'];
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    dark: true;
    light: true;
  }
}

const LinkBehavior = React.forwardRef<
HTMLAnchorElement,
Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
  const { href, ...other } = props;
  const to = href.toString().includes('?server=') ? href : `${href.toString()}?server=${JSON.parse(localStorage.server)}`;
  // Map href (MUI) -> to (react-router)
  {
    return <RouterLink ref={ref} to={to} {...other} />;
  }
});

export let theme = createTheme({
  components: {
    MuiLink:           { defaultProps: { component: LinkBehavior } as LinkProps },
    MuiButtonBase:     { defaultProps: { LinkComponent: LinkBehavior } },
    MuiIconButton:     { defaultProps: { LinkComponent: LinkBehavior } },
    MuiListItemButton: { defaultProps: { LinkComponent: LinkBehavior } },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'sans-serif',
    ].join(','),
  },
  palette: {
    mode:      'dark',
    primary:   { main: '#ffa000' },
    secondary: { main: '#0058a3' },
    info:      { main: '#2e90a8' },
    dark:      {
      main: grey[800], contrastText: '#fff',
    },
    light: {
      main: grey[200], contrastText: '#000',
    },
  },
});

theme = responsiveFontSizes(theme);
export default theme;
