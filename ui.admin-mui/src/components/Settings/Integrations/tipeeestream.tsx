import { LoadingButton } from '@mui/lab';
import { Alert, Box, Paper, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useScope } from '../../../hooks/useScope';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesIntegrationsTipeeestream: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const scope = useScope('integrations');
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps } = useSettings('/integrations/tipeeestream' as any);

  useEffect(() => {
    refresh();
  }, [ ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="tipeeestream">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.tipeeestream')}</Typography>
    {scope.sensitive ? <>
      {settings && <Paper elevation={1} sx={{ p: 1 }}>
        <Stack spacing={1}>
          <TextField
            {...TextFieldProps('apiKey', { helperText: translate('integrations.tipeeestream.settings.apiKey.help') })}
            type="password"
            label={translate('integrations.tipeeestream.settings.apiKey.title')}
          />
        </Stack>
      </Paper>}

      <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
      </Stack>
    </>
      : <Alert severity='error'>You don't have access to any settings of Qiwi integration.</Alert>
    }
  </Box>
  );
};

export default PageSettingsModulesIntegrationsTipeeestream;
