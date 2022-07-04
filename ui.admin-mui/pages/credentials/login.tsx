import { Backdrop, CircularProgress } from '@mui/material';
import { NextPage } from 'next/types';
import { useDidMount } from 'rooks';

const Login: NextPage = () => {
  useDidMount(() => {
    window.location.assign('http://ui-oauth-redirecter.soge.workers.dev/?state=' + encodeURIComponent(window.btoa(
      JSON.stringify({
        url:      window.location.origin,
        version:  2,
        referrer: document.referrer,
      })
    )));
  });
  return (<Backdrop open={true}><CircularProgress/></Backdrop>);
};

export default Login;
