import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { IsNotEmpty, validateOrReject } from 'class-validator';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

class Settings {
  @IsNotEmpty()
    domain: string;
}

const PageSettingsModulesCoreUI: React.FC<{
  onVisible: () => void,
  sx?: SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {
  const router = useRouter();
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/core/ui');
  const { translate } = useTranslation();

  const { propsError, setErrors, haveErrors } = useValidator({ translations: { domain: translate('core.ui.settings.domain.title') } });

  useEffect(() => {
    if (!loading && settings) {
      const toCheck = new Settings();
      toCheck.domain = settings.domain[0];
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

  return (<Box ref={ref} sx={sx} id="ui">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.ui')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <TextField
        {...propsError('domain')}
        fullWidth
        variant="filled"
        required
        value={settings.domain[0]}
        label={translate('core.ui.settings.domain.title')}
        onChange={(event) => handleChange('domain', event.target.value)}
      />

      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.enablePublicPage[0]} onChange={(_, checked) => handleChange('enablePublicPage', checked)} />} label={translate('core.ui.settings.enablePublicPage')} />
      </FormGroup>

      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.percentage[0]} onChange={(_, checked) => handleChange('percentage', checked)} />} label={translate('core.ui.settings.percentage')} />
      </FormGroup>

      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.shortennumbers[0]} onChange={(_, checked) => handleChange('shortennumbers', checked)} />} label={translate('core.ui.settings.shortennumbers')} />
      </FormGroup>

      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.showdiff[0]} onChange={(_, checked) => handleChange('showdiff', checked)} />} label={translate('core.ui.settings.showdiff')} />
      </FormGroup>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" onClick={save} disabled={haveErrors}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};
export default PageSettingsModulesCoreUI;
