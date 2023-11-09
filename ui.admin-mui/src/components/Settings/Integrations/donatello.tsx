import { LoadingButton } from '@mui/lab';
import { Box, Paper, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesIntegrationsDonatello: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps } = useSettings('/integrations/donatello' as any);

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

  return (loading ? null : <Box ref={ref} id="donatello">
    <Typography variant='h2' sx={{ pb: 2 }}>Donatello</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('token', { helperText: translate('integrations.donatello.settings.token.help') })}
          label={translate('integrations.donatello.settings.token.title')}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesIntegrationsDonatello;
