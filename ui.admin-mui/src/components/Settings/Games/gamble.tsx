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
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { PermissionTabs } from '~/src/components/Settings/PermissionTabs';
import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesGamesGamble: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'maxJackpotValue': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 100 || 'min|100',
    ],
    'lostPointsAddedToJackpot': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
      (value: string) => Number(value) <= 100 || 'max|100',
    ],
    '__permission_based__.settings.minimalBet': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const router = useRouter();
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, settingsInitial, handleChange, getPermissionSettingsValue, handleChangePermissionBased } = useSettings('/games/gamble' as any, validator);

  useEffect(() => {
    refresh();
  }, [ router, refresh, handleChange, translate ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="gamble">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.gamble')}</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={settings.enableJackpot[0]} onChange={(_, checked) => handleChange('enableJackpot', checked)} />}
            label={translate('games.gamble.settings.enableJackpot')}
          />
        </FormGroup>
        <TextField
          {...TextFieldProps('maxJackpotValue')}
          type="number"
          label={translate('games.gamble.settings.maxJackpotValue')}
        />
        <TextField
          {...TextFieldProps('lostPointsAddedToJackpot')}
          type="number"
          label={translate('games.gamble.settings.lostPointsAddedToJackpot')}
        />
        <Stack spacing={1}>
          <PermissionTabs settings={settings} errors={errors} handleChangePermissionBased={handleChangePermissionBased} getPermissionSettingsValue={getPermissionSettingsValue} ignoredPermissionsCategory='settings'>
            {({ TextFieldProps: TextFieldPropsTabs }) => <Stack spacing={1}>
              <TextField
                {...TextFieldPropsTabs('settings.minimalBet')}
                type='number'
                label={translate('games.gamble.settings.minimalBet')}
              />
              <TextField
                {...TextFieldPropsTabs('settings.chanceToTriggerJackpot')}
                type='number'
                label={translate('games.gamble.settings.chanceToTriggerJackpot')}
              />
              <TextField
                {...TextFieldPropsTabs('settings.chanceToWin')}
                type='number'
                label={translate('games.gamble.settings.chanceToWin.title')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  endAdornment:   TextFieldPropsTabs('settings.chanceToWin').InputProps.endAdornment,
                }}
              />
            </Stack>}
          </PermissionTabs>
        </Stack>
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesGamesGamble;
