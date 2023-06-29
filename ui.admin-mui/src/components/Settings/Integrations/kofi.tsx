import { LoadingButton } from '@mui/lab';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import parse from 'html-react-parser';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesIntegrationsKofi: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps } = useSettings('/integrations/kofi' as any);

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="kofi">
    <Typography variant='h2' sx={{ pb: 2 }}>KoFi</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('verification_token', { helperText: translate('integrations.kofi.settings.verification_token.help') })}
          label={translate('integrations.kofi.settings.verification_token.title')}
        />
        <TextField
          disabled
          variant='filled'
          value={JSON.parse(localStorage.server) + '/webhooks/kofi'}
          helperText={parse(translate('integrations.kofi.settings.webhook_url.help'))}
          label={translate('integrations.kofi.settings.webhook_url.title')}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesIntegrationsKofi;
