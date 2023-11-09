import { Alert, Backdrop, Link } from '@mui/material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Error404 = () => {
  return (<Backdrop open={true}>
    <Alert severity="error" icon={false}>
      There are <strong style={{ fontSize: '50px' }}>404</strong> reasons this page doesn't exists.
      <br/>
      Go back to <Link component={RouterLink} to="/">landing page</Link>.
    </Alert>
  </Backdrop>);
};

export default Error404;
