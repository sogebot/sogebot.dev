import grey from '@mui/material/colors/grey';
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    dark: Palette['primary'];
  }
  interface PaletteOptions {
    dark: PaletteOptions['primary'];
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    dark: true;
  }
}

export const theme = createTheme({
  palette: {
    mode:      'dark',
    primary:   { main: '#ffa000' },
    secondary: { main: '#0058a3' },
    info:      { main: '#2e90a8' },
    dark:      {
      main: grey[800], contrastText: '#fff', 
    },
  },
});
export default theme;
