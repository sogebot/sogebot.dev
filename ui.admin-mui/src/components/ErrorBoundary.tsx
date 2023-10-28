import {
  Box, Paper, Typography,
} from '@mui/material';
import React, {
  Component, ErrorInfo, ReactNode,
} from 'react';
import { Link } from 'react-router-dom';

import { versions } from '../compatibilityList';
import theme from '../theme';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };
  public error: Error | null = null;
  public errorInfo: ErrorInfo | null = null;

  public static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.error = error;
    this.errorInfo = errorInfo;
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <Box sx={{
        p: 10, overflow: 'auto',
      }}>
        <Typography variant='h1'>Oops. This shouldn't happen!</Typography>
        <Typography variant='h2'>Please share these logs in our discord channel.</Typography>

        {this.error
          ? <Paper sx={{
            m: 4, p: 2, border: `1px solid ${theme.palette.error.main}`, maxHeight: 200, overflow: 'auto',
          }}>
            {this.error.stack}
          </Paper>
          : <></>}
        {this.errorInfo
          ? <Paper sx={{
            m: 4, mb: 0, p: 2, border: `1px solid ${theme.palette.error.main}`, maxHeight: 200, overflow: 'auto',
          }}>
            {this.errorInfo?.componentStack}
          </Paper>
          : <></>}

        <Typography variant='h4' sx={{ mt: 4 }}>You can also use these older versions</Typography>
        <Typography variant='h6'>Note: older versions may not be 100% compatible with your version.</Typography>
        <ul>
          {Object.entries(versions).map(([key, value], i) => <li key={i}>
            <Link to={new URL(`${location.protocol}//${location.hostname}:${location.port}/${value}`).toString()}>Bot version <strong>{key}</strong> - commit <strong>{value}</strong></Link>
          </li>)}
        </ul>

      </Box>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
