import { LoadingButton } from '@mui/lab';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesIntegrationsTwitter: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps } = useSettings('/integrations/twitter' as any);

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="twitter">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.twitter')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('token.consumerKey')}
          type="password"
          label={translate('integrations.twitter.settings.consumerKey')}
        />
        <TextField
          {...TextFieldProps('token.consumerSecret')}
          type="password"
          label={translate('integrations.twitter.settings.consumerSecret')}
        />
        <TextField
          {...TextFieldProps('token.accessToken')}
          type="password"
          label={translate('integrations.twitter.settings.accessToken')}
        />
        <TextField
          {...TextFieldProps('token.secretToken')}
          type="password"
          label={translate('integrations.twitter.settings.secretToken')}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesIntegrationsTwitter;
