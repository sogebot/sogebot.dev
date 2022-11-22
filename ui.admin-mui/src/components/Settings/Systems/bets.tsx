import { LoadingButton } from '@mui/lab';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  IsInt, IsNotEmpty, Min, validateOrReject,
} from 'class-validator';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

class Settings {
  @IsNotEmpty()
  @Min(0, { message: '$constraint1' })
  @IsInt()
    betPercentGain: any;
}

const PageSettingsModulesSystemsBets: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const router = useRouter();
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/systems/bets');
  const { translate } = useTranslation();

  const { propsError, setErrors, haveErrors } = useValidator({ translations: { betPercentGain: translate('systems.bets.settings.betPercentGain') } });

  useEffect(() => {
    if (!loading && settings) {
      const toCheck = new Settings();
      toCheck.betPercentGain = settings.betPercentGain[0].length > 0 ? Number(settings.betPercentGain[0]) : '';
      validateOrReject(toCheck, { always: true })
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [loading, settings, setErrors]);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="bets">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.bets')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...propsError('betPercentGain')}
          variant='filled'
          fullWidth
          type='number'
          value={settings.betPercentGain[0]}
          label={translate('systems.bets.settings.betPercentGain')}
          onChange={(event) => handleChange('betPercentGain', event.target.value)}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={haveErrors}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsBets;
