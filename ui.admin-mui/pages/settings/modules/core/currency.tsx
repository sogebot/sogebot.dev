import { ArrowBackIosNewTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  cloneDeep, get, set,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesCoreTTS: NextPageWithLayout = () => {
  const socketEndpoint = '/core/currency';

  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ loading, setLoading ] = useState(true);
  const [ dirty, setDirty ] = useState(false);
  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise<void>((resolve, reject) => {
      getSocket(socketEndpoint)
        .emit('settings', (err, _settings: {
          [x: string]: any
        }, _ui: {
          [x: string]: {
            [attr: string]: any
          }
        }) => {
          if (err) {
            reject(err);
            return;
          }
          setUI(_ui);
          setSettings(_settings);
          resolve();
        });
    });
    setLoading(false);
  }, [ ]);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ saving, setSaving ] = useState(false);
  const save = useCallback(() => {
    if (settings) {
      setSaving(true);
      saveSettings(socketEndpoint, settings)
        .then(() => {
          setDirty(false);
          enqueueSnackbar('Settings saved.', { variant: 'success' });
        })
        .finally(() => setSaving(false));
    }
  }, [ settings, enqueueSnackbar ]);

  const handleChange = (key: string, value: any): void => {
    setSettings((settingsObj) => {
      if (!settingsObj) {
        return null;
      }
      const newSettingsObj = cloneDeep(settingsObj);
      set(newSettingsObj, key, [value, get(settingsObj, `${key}[1]`)]);
      return newSettingsObj;
    });
  };

  return (
    <Box sx={{
      maxWidth: 960, m: 'auto',
    }}>

      <Button sx={{ mb: 1 }} onClick={() => router.push('/settings/modules')}><ArrowBackIosNewTwoTone sx={{ pr: 1 }}/>{translate('menu.modules')}</Button>

      <Typography variant='h1' sx={{ pb: 2 }}>{ translate('menu.currency')}</Typography>
      <Typography variant='h3' sx={{ pb: 2 }}>{ translate('categories.general') }</Typography>
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
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={!dirty}>Save changes</LoadingButton>
      </Stack>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>
    </Box>
  );
};

PageSettingsModulesCoreTTS.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsModulesCoreTTS;
