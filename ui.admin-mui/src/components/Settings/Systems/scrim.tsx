import { LoadingButton } from '@mui/lab';
import { Box, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesSystemsScrim: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'customization.waitForMatchIdsInSeconds': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps } = useSettings('/systems/scrim' as any, validator);

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

  return (loading ? null : <Box ref={ref} id="scrim">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.scrim') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('customization.waitForMatchIdsInSeconds')}
          label={translate(`systems.scrim.settings.waitForMatchIdsInSeconds.title`)}
          type="number"
          InputProps={{ startAdornment: <InputAdornment position="start">{translate(`systems.scrim.settings.waitForMatchIdsInSeconds.help`)}</InputAdornment> }}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsScrim;
