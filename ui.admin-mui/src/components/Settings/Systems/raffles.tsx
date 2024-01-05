import { LoadingButton } from '@mui/lab';
import { Box, Checkbox, FormControlLabel, FormGroup, FormHelperText, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesSystemsRaffles: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'reminder.everyXMessages': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'reminder.everyXSeconds': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'join.announceNewEntriesBatchTime': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'luck.subscribersPercent': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, handleChange } = useSettings('/systems/raffles' as any, validator);

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

  return (loading ? null : <Box ref={ref} id="raffles">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.raffles') }</Typography>

    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.allowOverTicketing[0]} onChange={(_, checked) => handleChange('allowOverTicketing', checked)} />}
            label={<>
              {translate('systems.raffles.settings.allowOverTicketing.title')}
              <FormHelperText>{translate('systems.raffles.settings.allowOverTicketing.help')}</FormHelperText>
            </>}
          />
        </FormGroup>
        <TextField
          {...TextFieldProps('raffleAnnounceInterval')}
          label={translate(`systems.raffles.settings.raffleAnnounceInterval.title`)}
          InputProps={{ startAdornment: <InputAdornment position="start">{translate(`systems.raffles.settings.raffleAnnounceInterval.help`)}</InputAdornment> }}
        />
        <TextField
          {...TextFieldProps('raffleAnnounceMessageInterval', { helperText: translate(`systems.raffles.settings.raffleAnnounceMessageInterval.help`) })}
          label={translate(`systems.raffles.settings.raffleAnnounceMessageInterval.title`)}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.join') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.join.deleteRaffleJoinCommands[0]} onChange={(_, checked) => handleChange('join.deleteRaffleJoinCommands', checked)} />}
            label={<>
              {translate('systems.raffles.settings.deleteRaffleJoinCommands.title')}
              <FormHelperText>{translate('systems.raffles.settings.deleteRaffleJoinCommands.help')}</FormHelperText>
            </>}
          />
        </FormGroup>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.join.announceNewEntries[0]} onChange={(_, checked) => handleChange('join.announceNewEntries', checked)} />}
            label={<>
              {translate('systems.raffles.settings.announceNewEntries.title')}
              <FormHelperText>{translate('systems.raffles.settings.announceNewEntries.help')}</FormHelperText>
            </>}
          />
        </FormGroup>
        <TextField
          {...TextFieldProps('join.announceNewEntriesBatchTime', { helperText: translate('systems.raffles.settings.announceNewEntriesBatchTime.help') })}
          type="number"
          label={translate(`systems.raffles.settings.announceNewEntriesBatchTime.title`)}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.luck') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('luck.subscribersPercent')}
          label={translate(`systems.raffles.settings.subscribersPercent.title`)}
          type="number"
          InputProps={{ startAdornment: <InputAdornment position="start">{translate(`systems.raffles.settings.subscribersPercent.help`)}</InputAdornment> }}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsRaffles;
