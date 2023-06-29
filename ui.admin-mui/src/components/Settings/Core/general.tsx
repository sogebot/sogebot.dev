import { LoadingButton } from '@mui/lab';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import FormLabel from '@mui/material/FormLabel';
import Slider from '@mui/material/Slider';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';

import { format } from '../../../helpers/number';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesCoreGeneral: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const { settings, loading, refresh, save, saving, ui, handleChange } = useSettings('/core/general');
  const { translate } = useTranslation();

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  const formats = ['', ' ', ',', '.'];
  const pointsOptions = formats.map(o => ({
    text: `${format(o, 0)(123456789.016)} or ${format(o, 2)(123456789.016)}`, value: o,
  }));

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="general">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.general') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormControl  variant="filled" sx={{ minWidth: 300 }}>
          <InputLabel id="currency-default-value">{translate('core.general.settings.lang')}</InputLabel>
          <Select
            MenuProps={{ PaperProps: { sx: { maxHeight: 500 } } }}
            labelId="currency-default-value"
            id="demo-simple-select"
            value={settings.general.lang[0]}
            label={translate('core.general.settings.lang')}
            onChange={(event) => handleChange('general.lang', event.target.value)}
          >
            {ui && ui.general.lang.values.map((item: string) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl  variant="filled" sx={{ minWidth: 300 }}>
          <InputLabel id="currency-default-value" shrink>{translate('core.general.settings.numberFormat')}</InputLabel>
          <Select
            displayEmpty
            MenuProps={{ PaperProps: { sx: { maxHeight: 500 } } }}
            labelId="currency-default-value"
            id="demo-simple-select"
            value={settings.general.numberFormat[0]}
            label={translate('core.general.settings.numberFormat')}
            onChange={(event) => handleChange('general.numberFormat', event.target.value)}
          >
            {pointsOptions.map(item => <MenuItem key={item.value} value={item.value}>{item.text}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 60px 0 0' }}>
          <FormLabel sx={{ width: '400px' }}>{translate('core.general.settings.gracefulExitEachXHours.title')}</FormLabel>
          <Slider
            value={settings.graceful_exit.gracefulExitEachXHours[0]}
            max={24}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => value > 0 ? `every ${value} hour(s)` : 'Never'}
            onChange={(event, newValue) => handleChange('graceful_exit.gracefulExitEachXHours', newValue)}
          />
        </Stack>
      </Stack>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesCoreGeneral;
