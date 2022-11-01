import { ArrowBackIosNewTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
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
import { format } from '@sogebot/ui-helpers/number';
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
  const socketEndpoint = '/core/general';

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
          console.log({ _settings });
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
      console.log([value, get(settingsObj, `${key}[1]`)]);
      set(newSettingsObj, key, [value, get(settingsObj, `${key}[1]`)]);
      return newSettingsObj;
    });
  };

  const formats = ['', ' ', ',', '.'];
  const pointsOptions = formats.map(o => ({
    text: `${format(o, 0)(123456789.016)} or ${format(o, 2)(123456789.016)}`, value: o,
  }));

  return (
    <Box sx={{
      maxWidth: 960, m: 'auto',
    }}>

      <Button sx={{ mb: 1 }} onClick={() => router.push('/settings/modules')}><ArrowBackIosNewTwoTone sx={{ pr: 1 }}/>{translate('menu.modules')}</Button>

      <Typography variant='h1' sx={{ pb: 2 }}>General</Typography>
      <Typography variant='h3' sx={{ pb: 2 }}>{ translate('categories.general') }</Typography>
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
          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '30px 60px 0 0' }}>
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
