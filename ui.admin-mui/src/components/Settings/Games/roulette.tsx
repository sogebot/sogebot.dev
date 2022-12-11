import { LoadingButton } from '@mui/lab';
import {
  Box,
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

import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesGamesRoulette: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'timeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'rewards.winnerWillGet': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'rewards.loserWillLose': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const router = useRouter();
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, settingsInitial, handleChange } = useSettings('/games/roulette' as any, validator);

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

  return (loading ? null : <Box ref={ref} id="roulette">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.roulette')}</Typography>
    {settings && settingsInitial && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('timeout')}
          type="number"
          InputProps={{ startAdornment: <InputAdornment position="start">{translate('games.roulette.settings.timeout.help')}</InputAdornment> }}
          label={translate('games.roulette.settings.timeout.title')}
        />
        <TextField
          {...TextFieldProps('rewards.winnerWillGet')}
          type="number"
          label={translate('games.roulette.settings.winnerWillGet')}
        />
        <TextField
          {...TextFieldProps('rewards.loserWillLose')}
          type="number"
          label={translate('games.roulette.settings.loserWillLose')}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesGamesRoulette;
