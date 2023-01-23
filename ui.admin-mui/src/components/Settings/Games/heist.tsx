import { LoadingButton } from '@mui/lab';
import {
  Box,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, {
  useEffect, useMemo, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { SettingsSystemsDialogHeistLevels } from '../Dialog/HeistLevels';
import { SettingsSystemsDialogHeistResults } from '../Dialog/HeistResults';

const PageSettingsModulesGamesHeist: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'options.showMaxUsers': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 1 || 'min|1',
    ],
    'options.copsCooldownInMinutes': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 1 || 'min|1',
    ],
    'options.entryCooldownInSeconds': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 1 || 'min|1',
    ],
    'notifications.started': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'notifications.nextLevelMessage': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'notifications.maxLevelMessage': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'notifications.copsOnPatrol': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'notifications.copsCooldown': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'results.singleUserSuccess': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'results.singleUserFailed': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'results.noUser': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, settingsInitial, handleChange } = useSettings('/games/heist' as any, validator);
  const [ levelError, setLevelError ] = useState(false);
  const [ resultsError, setResultsError ] = useState(false);

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

  return (loading ? null : <Box ref={ref} id="heist">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.heist')}</Typography>

    <Typography variant='h5' sx={{ pb: 2 }}>{ translate('categories.options')}</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('options.showMaxUsers')}
          type="number"
          label={translate('games.heist.settings.showMaxUsers')}
        />
        <TextField
          {...TextFieldProps('options.copsCooldownInMinutes')}
          type="number"
          label={translate('games.heist.settings.copsCooldownInMinutes.title')}
          InputProps={{ startAdornment: <InputAdornment position="start">{translate('games.heist.settings.copsCooldownInMinutes.help')}</InputAdornment> }}
        />
        <TextField
          {...TextFieldProps('options.entryCooldownInSeconds')}
          type="number"
          label={translate('games.heist.settings.entryCooldownInSeconds.title')}
          InputProps={{ startAdornment: <InputAdornment position="start">{translate('games.heist.settings.entryCooldownInSeconds.help')}</InputAdornment> }}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.notifications')}</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('notifications.started')}
          label={translate('games.heist.settings.started')}
        />
        <TextField
          {...TextFieldProps('notifications.nextLevelMessage')}
          label={translate('games.heist.settings.nextLevelMessage')}
        />
        <TextField
          {...TextFieldProps('notifications.maxLevelMessage')}
          label={translate('games.heist.settings.maxLevelMessage')}
        />
        <TextField
          {...TextFieldProps('notifications.copsOnPatrol')}
          label={translate('games.heist.settings.copsOnPatrol')}
        />
        <TextField
          {...TextFieldProps('notifications.copsCooldown')}
          label={translate('games.heist.settings.copsCooldown')}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.levels')}</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <SettingsSystemsDialogHeistLevels onLevelsError={setLevelError} title={ translate('categories.levels')}  items={settings.levels.levelsValues[0]} onChange={(value) => handleChange('levels.levelsValues', value)}/>
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.results')}</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('results.singleUserSuccess')}
          label={translate('games.heist.settings.singleUserSuccess')}
        />
        <TextField
          {...TextFieldProps('results.singleUserFailed')}
          label={translate('games.heist.settings.singleUserFailed')}
        />
        <TextField
          {...TextFieldProps('results.noUser')}
          label={translate('games.heist.settings.noUser')}
        />
        <SettingsSystemsDialogHeistResults onError={setResultsError} title={ translate('categories.levels')}  items={settings.results.resultsValues[0]} onChange={(value) => handleChange('results.resultsValues', value)}/>
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0 || levelError || resultsError}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesGamesHeist;
