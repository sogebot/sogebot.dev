import { Box, Button, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useRefElement } from 'rooks';

import { baseURL } from '../../../helpers/getBaseURL';
import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesIntegrationsStreamlabs: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const { translate } = useTranslation();

  const { settings, loading, refresh } = useSettings('/integrations/streamlabs' as any);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    refresh();
  }, [ ]);

  const user = useMemo(() => {
    if (settings && settings.userName[0].length > 0) {
      return settings.userName[0];
    }
    return 'Not Authorized';
  }, [settings]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const revoke = useCallback(() => {
    getSocket('/integrations/streamlabs').emit('revoke', () => {
      enqueueSnackbar('User access revoked.', { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar ]);

  const authorize = useCallback(() => {
    const popup = window.open(baseURL + '/credentials/streamlabs', 'popup', 'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no');
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        refresh();
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [ enqueueSnackbar ]);

  return (loading ? null : <Box ref={ref} id="streamlabs">
    <Typography variant='h2' sx={{ pb: 2 }}>Streamlabs</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          disabled
          variant='filled'
          value={user}
          label={translate('integrations.lastfm.settings.username')}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              { user !== 'Not Authorized'
                ? <Button color="error" variant="contained" onClick={revoke}>Revoke</Button>
                : <Button color="success" variant="contained" onClick={authorize}>Authorize</Button>
              }
            </InputAdornment>,
          }}
        />
      </Stack>
    </Paper>}
  </Box>
  );
};

export default PageSettingsModulesIntegrationsStreamlabs;
