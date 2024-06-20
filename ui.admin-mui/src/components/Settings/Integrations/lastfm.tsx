import { LoadingButton } from '@mui/lab';
import { Box, FormControl, FormControlLabel, FormLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useScope } from '../../../hooks/useScope';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesIntegrationsLastFM: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const scope = useScope('integrations');
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, handleChange } = useSettings('/integrations/lastfm' as any);

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

  return (loading ? null : <Box ref={ref} id="lastfm">
    <Typography variant='h2' sx={{ pb: 2 }}>Last.fm</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        {scope.sensitive && <>
          <TextField
            {...TextFieldProps('apiKey')}
            type="password"
            label={translate('integrations.lastfm.settings.apiKey')}
          />
          <TextField
            {...TextFieldProps('username')}
            label={translate('integrations.lastfm.settings.username')}
          />
        </>}
        <FormControl>
          <FormLabel id="demo-settings-notify-label">{translate('systems.songs.settings.notify')}</FormLabel>
          <RadioGroup
            row
            aria-labelledby="demo-settings-notify-label"
            name="settings-notify"
            value={String(settings.notify[0])}
            onChange={(event) => handleChange('notify', Number(event.target.value))}
          >
            <FormControlLabel value='0' control={<Radio />} label="Disabled" />
            <FormControlLabel value='1' control={<Radio />} label="All" />
            <FormControlLabel value='2' control={<Radio />} label="Online only" />
          </RadioGroup>
        </FormControl>
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesIntegrationsLastFM;
