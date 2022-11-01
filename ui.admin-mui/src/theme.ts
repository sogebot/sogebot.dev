import grey from '@mui/material/colors/grey';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

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

export let theme = createTheme({
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
