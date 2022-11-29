import { LoadingButton } from '@mui/lab';
import {
  Box,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useEffect, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesIntegrationsStreamelements: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const { settings, loading, refresh, TextFieldProps } = useSettings('/integrations/streamelements' as any);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const [ validating, setValidating ] = useState(false);
  const validate = useCallback(async () => {
    if (!settings) {
      return;
    }
    setValidating(true);
    try {
      await axios('https://api.streamelements.com/kappa/v2/channels/me', {
        method:  'GET',
        headers: {
          Accept:        'application/json',
          Authorization: 'Bearer ' + settings.jwtToken[0],
        },
      });

      // we don't need to check anything, if request passed it is enough
      enqueueSnackbar('JWT token is valid.', { variant: 'success' });
      setTimeout(() => {
        setValidating(false);
      }, 1000);
    } catch (e) {
      enqueueSnackbar('Invalid JWT Token, please recheck if you copied your token correctly', { variant: 'error' });
      setTimeout(() => {
        setValidating(false);
      }, 1000);
    }
  }, [ enqueueSnackbar, settings ]);

  return (loading ? null : <Box ref={ref} id="streamelements">
    <Typography variant='h2' sx={{ pb: 2 }}>StreamElements</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('jwtToken', { helperText: translate('integrations.streamelements.settings.jwtToken.help') })}
          type="password"
          label={translate('integrations.streamelements.settings.jwtToken.title')}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              { settings.jwtToken[0].length > 0
                ? <LoadingButton loading={validating} variant="contained" onClick={validate}>Validate</LoadingButton>
                : ''
              }
            </InputAdornment>,
          }}
        />
      </Stack>
    </Paper>}
  </Box>
  );
};

export default PageSettingsModulesIntegrationsStreamelements;
