import CookieIcon from '@mui/icons-material/Cookie';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, Fade, FormControlLabel, FormGroup, Paper, Stack, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocalstorageState } from 'rooks';

import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { toggleCookieManager } from '../store/loaderSlice';

export default function CookieBar() {
  const [ open, setOpen ] = useState(false);
  const { state, connectedToServer, showCookieManager } = useAppSelector(s => s.loader);
  const dispatch = useAppDispatch();

  const connected = useMemo(() => connectedToServer && state, [connectedToServer, state]);

  const [ cookieControlConsent, setCookieControlConsent ] = useLocalstorageState('cookie_control_consent', 0);
  const [ cookieControlEnabledCookies, setCookieControlEnabled ] = useLocalstorageState('cookie_control_enabled_cookies', ['mandatory', 'functional']);

  useEffect(() => {
    if (connected) {
      setCookieControlConsent(Date.now() + 3.154e+10); // add year consent
    }
  }, [connected, setCookieControlConsent]);

  useEffect(() => {
    if(showCookieManager) {
      setOpen(true);
    }
  }, [showCookieManager]);

  useEffect(() => {
    if (!open) {
      dispatch(toggleCookieManager(false));
    }
  }, [open, dispatch]);

  const acceptAll = () => {
    setCookieControlConsent(Date.now() + 3.154e+10); // add year consent
    setCookieControlEnabled(['mandatory', 'functional', 'ms-clarity' ]);
    (window as any).clarity('consent');
  };

  const revokeAll = () => {
    setCookieControlConsent(Date.now() + 3.154e+10); // add year consent
    setCookieControlEnabled(['mandatory', 'functional']);
  };

  useEffect(() => {
    if (cookieControlConsent && cookieControlConsent < Date.now()) {
      setCookieControlConsent(0);
    }
  }, [cookieControlConsent, setCookieControlConsent]);

  const updateEnabledCookies = useCallback((key: string, checked: boolean) => {
    if (checked) {
      if (key === 'ms-clarity') {
        (window as any).clarity('consent');
      }
      setCookieControlEnabled(Array.from(new Set([...cookieControlEnabledCookies ?? [], key])));
    } else {
      setCookieControlEnabled((cookieControlEnabledCookies ?? []).filter(val => val !== key));
    }
    setCookieControlConsent(Date.now() + 3.154e+10); // add year consent
  }, [ cookieControlEnabledCookies, setCookieControlConsent, setCookieControlEnabled ]);

  return (<>
    {!connected && <Fade in={cookieControlConsent !== null}>
      { cookieControlConsent === 0 ? <Box sx={{
        position: 'absolute', right: 10, top: 10, width: '500px', p: 2, marginLeft: 'auto', zIndex: 9999999,
      }} component={Paper}>
        <Typography variant={'h5'} sx={{
          fontWeight: 'bold', pb: 2,
        }}>Cookies</Typography>
        <Typography>We are using own cookies and third-party cookies, to analyze usage and understand how we can make this dashboard better.</Typography>
        <Typography sx={{ pt: 2 }}>If you continue and connect to your bot server, we assume you accepted mandatory cookies.</Typography>

        <Stack direction='row' spacing={2} justifyContent='flex-end' sx={{ pt: 2 }}>
          <Button variant='contained' onClick={() => setOpen(true)}>Manage cookie settings</Button>
          <Button variant='contained' onClick={acceptAll}>Accept all</Button>
        </Stack>
      </Box>
        : <Box sx={{
          position: 'absolute', right: 10, top: 10, zIndex: 10, textAlign: 'right', width: 'fit-content', marginLeft: 'auto',
        }}><Button variant='contained' onClick={() => setOpen(true)} size='small' sx={{
            borderRadius: '0 !important', height: '50px', width: '50px', minWidth: 0,
          }}><CookieIcon sx={{ fontSize: '30px' }}/></Button>
        </Box>
      }
    </Fade>
    }
    <Dialog open={open}>
      <DialogContent>
        <DialogContentText>
          <Typography variant={'h5'} sx={{
            fontWeight: 'bold', pb: 2,
          }}>Mandatory cookies</Typography>
          <FormGroup>
            <FormControlLabel disabled control={<Checkbox defaultChecked/>} label={<Typography>
              <Typography component='span' sx ={{ fontWeight: 'bold' }}>MANDATORY</Typography> - used to save user cookie preference.
              <Typography variant='caption' component='div'>cookie_control_consent</Typography>
              <Typography variant='caption' component='div'>cookie_control_enabled_cookies</Typography>
            </Typography>} />
          </FormGroup>
          <FormGroup>
            <FormControlLabel disabled control={<Checkbox defaultChecked/>} label={<Typography>
              <Typography component='span' sx ={{ fontWeight: 'bold' }}>FUNCTIONAL</Typography> - necessary cookies for bot usage.
            </Typography>} />
          </FormGroup>

          <Typography variant={'h5'} sx={{
            fontWeight: 'bold', py: 2,
          }}>Optional cookies</Typography>
          <FormGroup>
            <FormControlLabel control={<Checkbox onChange={(_, checked) => updateEnabledCookies('ms-clarity', checked)} checked={cookieControlEnabledCookies?.includes('ms-clarity')}/>} label={<Typography>
              <Typography component='span' sx ={{ fontWeight: 'bold' }}>MICROSOFT CLARITY</Typography> - differentation of user session.
            </Typography>} />
          </FormGroup>

        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={() => {
          setOpen(false); setCookieControlConsent(Date.now() + 3.154e+10);
        }}>Save</Button>
        <Button variant='contained' onClick={() => {
          acceptAll(); setOpen(false);
        }}>Accept all</Button>
        <Button variant='contained' onClick={() => {
          revokeAll(); setOpen(false);
        }}>Decline all</Button>
      </DialogActions>
    </Dialog>

    <Helmet>
      <script
        id="clarityFnc"
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "cnni7q4jrp");`,
        }}/>
    </Helmet>
  </>);
}