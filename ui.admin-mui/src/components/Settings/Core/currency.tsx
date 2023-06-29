import { LoadingButton } from '@mui/lab';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesCoreCurrency: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const { settings, loading, refresh, save, saving, handleChange, ui } = useSettings('/core/currency');
  const { translate } = useTranslation();

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

  return (loading ? null : <Box ref={ref} id="currency">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.currency')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Grid container sx={{ pb: 1 }}>
        <Grid item xs>
          <FormControl  variant="filled" fullWidth>
            <InputLabel id="currency-default-value">{translate('core.currency.settings.mainCurrency')}</InputLabel>
            <Select
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight:         500,
                    '& .MuiMenu-list': { columnCount: 8 },
                  },
                },
              }}
              labelId="currency-default-value"
              id="demo-simple-select"
              value={settings.currency.mainCurrency[0]}
              label={translate('core.currency.settings.mainCurrency')}
              onChange={(event) => handleChange('currency.mainCurrency', event.target.value)}
            >
              {ui && ui.currency.mainCurrency.values.map((item: string) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesCoreCurrency;
