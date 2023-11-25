import { LoadingButton } from '@mui/lab';
import { Box, Checkbox, FormControlLabel, FormGroup, Paper, Stack, TextField, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';
import { z } from 'zod';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidator';

const schema = z.object({
  domain: z.string().min(1),
});

const PageSettingsModulesCoreUI: React.FC<{
  onVisible: () => void,
  sx?:       SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/core/ui');
  const { translate } = useTranslation();

  const { propsError, haveErrors, validate } = useValidator({
    schema,
    translations: { domain: translate('core.ui.settings.domain.title') }
  });

  useEffect(() => {
    if (!loading && settings) {
      validate({ domain: settings.domain[0] }, true);
    }
  }, [loading, settings]);

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
  </Box>
  );
};
export default PageSettingsModulesCoreUI;
