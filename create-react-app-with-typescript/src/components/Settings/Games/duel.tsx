import { LoadingButton } from '@mui/lab';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesGamesDuel: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'cooldown': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'duration': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'minimalBet': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, settingsInitial, handleChange } = useSettings('/games/duel' as any, validator);

  useEffect(() => {
    refresh();
  }, [ refresh, handleChange, translate ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="duel">
    <Typography variant='h2' sx={{ pb: 2 }}>Duel</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.bypassCooldownByOwnerAndMods[0]} onChange={(_, checked) => handleChange('bypassCooldownByOwnerAndMods', checked)} />}
            label={translate('games.duel.settings.bypassCooldownByOwnerAndMods')}
          />
        </FormGroup>
        <TextField
          {...TextFieldProps('cooldown')}
          type="number"
          label={translate('games.duel.settings.cooldown')}
        />
        <TextField
          {...TextFieldProps('duration')}
          type="number"
          InputProps={{ startAdornment: <InputAdornment position="start">{translate('games.duel.settings.duration.help')}</InputAdornment> }}
          label={translate('games.duel.settings.duration.title')}
        />
        <TextField
          {...TextFieldProps('minimalBet')}
          type="number"
          label={translate('games.duel.settings.minimalBet')}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesGamesDuel;
