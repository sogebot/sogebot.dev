import { LoadingButton } from '@mui/lab';
import { Box, Checkbox, Collapse, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';
import { z } from 'zod';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidator';

const schema = z.object({
  minFollowTime: z.number().int().min(0),
});

const PageSettingsModulesSystemsAntihateRaid: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/systems/antihateraid');
  const { translate } = useTranslation();

  const { propsError, setErrors, haveErrors, validate } = useValidator({
    schema,
    translations: { minFollowTime: translate('systems.antihateraid.settings.minFollowTime') }
  });

  useEffect(() => {
    if (!loading && settings) {
      validate({ minFollowTime: settings.minFollowTime[0] }, true);
    }
  }, [loading, settings, setErrors]);

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

  return (loading ? null : <Box ref={ref} id="antihateraid">
    <Typography variant='h2' sx={{ pb: 2 }}>AntiHate Raid</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.clearChat[0]} onChange={(_, checked) => handleChange('clearChat', checked)} />} label={translate('systems.antihateraid.settings.clearChat')} />
        </FormGroup>

        <FormControl fullWidth variant='filled'>
          <InputLabel id="mode-label">{translate('systems.antihateraid.settings.mode')}</InputLabel>
          <Select
            labelId="mode-label"
            id="mode-select"
            variant='filled'
            value={settings.mode[0]}
            label={translate('systems.antihateraid.settings.mode')}
            onChange={(event) => handleChange('mode', event.target.value)}
          >
            <MenuItem value={0}>sub-only</MenuItem>
            <MenuItem value={1}>follow-only</MenuItem>
            <MenuItem value={2}>emotes-only</MenuItem>
          </Select>
        </FormControl>

        <Collapse in={settings.mode[0] === 1} unmountOnExit>
          <TextField
            variant='filled'
            {...propsError('minFollowTime')}
            fullWidth
            value={settings.minFollowTime[0]}
            label={translate('systems.antihateraid.settings.minFollowTime')}
            onChange={(event) => handleChange('minFollowTime', event.target.value)}
            type='number'
            InputProps={{ endAdornment: <InputAdornment position="end">minutes</InputAdornment> }}
          />
        </Collapse>

        <TextField
          variant='filled'
          fullWidth
          value={settings.customAnnounce[0]}
          helperText={'$mode, $username'}
          label={translate('systems.antihateraid.settings.customAnnounce')}
          onChange={(event) => handleChange('customAnnounce', event.target.value)}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={haveErrors}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsAntihateRaid;
