import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  cloneDeep, get, set,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useEffect, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesCoreUpdater: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const socketEndpoint = '/core/updater';

  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ updating, setUpdating ] = useState<string[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  // const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise<void>((resolve, reject) => {
      getSocket(socketEndpoint)
        .emit('settings', (err, _settings: {
          [x: string]: any
        }, /* _ui: {
          [x: string]: {
            [attr: string]: any
          }
        }*/ ) => {
          if (err) {
            reject(err);
            return;
          }
          // setUI(_ui);
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

  const [isChecking, setIsChecking] = useState(false);

  const manualCheck = useCallback(() => {
    setIsChecking(true);
    setLoading(true);
    getSocket(`/core/updater`)
      .emit('updater::check', () => {
        setIsChecking(false);
        refresh();
      });
  }, [refresh]);

  const update = useCallback((pkg: string) => {
    if (settings) {
      setUpdating(values => {
        return Array.from(new Set([...values, pkg]));
      });
      getSocket(`/core/updater`).emit('updater::trigger', {
        pkg, version: settings.versionsAvailable[0][pkg],
      }, (err) => {
        if (err) {
          enqueueSnackbar(`Package ${pkg} was not successfuly updated.`, { variant: 'error' });
        } else {
          enqueueSnackbar(`Package ${pkg} was successfuly updated to ${settings.versionsAvailable[0][pkg]}.`, { variant: 'success' });
        }

        setUpdating(values => {
          return [...values.filter(o => o !== pkg)];
        });
        refresh();
      });
    }
  }, [refresh, settings, enqueueSnackbar]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (<Box ref={ref} id="updater">
    <Typography variant='h1' sx={{ pb: 2 }}>{translate('menu.updater')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack direction='row' justifyContent={'space-between'}>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.isAutomaticUpdateEnabled[0]} onChange={(_, checked) => handleChange('isAutomaticUpdateEnabled', checked)} />} label={translate('core.updater.settings.isAutomaticUpdateEnabled')} />
        </FormGroup>
        <LoadingButton variant='contained' color='light' loading={isChecking} onClick={manualCheck}>Check for new versions</LoadingButton>
      </Stack>

      <List>
        {Object.keys(settings.versions[0]).map(key => <ListItem
          key={key}
          disablePadding
          secondaryAction={<>
            {settings.versions[0][key] !== settings.versionsAvailable[0][key] && <Button sx={{
              width: 150, mr: 2,
            }} color='light' target="_blank" href={`https://github.com/${key.replace('@', '')}/compare/v${settings.versions[0][key]}...v${settings.versionsAvailable[0][key]}`}>
                Changelog
            </Button>}
            {settings.versions[0][key] !== settings.versionsAvailable[0][key] && <LoadingButton sx={{ width: 150 }} variant='contained' color='secondary' loading={updating.includes(key)} onClick={() => update(key)}>
                Update
            </LoadingButton>}
          </>
          }>
          <ListItemText
            primary={<Typography>{ key }</Typography>}
            secondary={<>
              <Typography component={'span'} fontWeight={'bold'}>Installed: </Typography>
              <Typography component={'span'}>{ settings.versions[0][key] }</Typography>
              <br/>
              <Typography component={'span'} fontWeight={'bold'}>Latest compatible version: </Typography>
              <Typography component={'span'}>{ settings.versionsAvailable[0][key] }</Typography>
            </>}
          />
        </ListItem>)}
      </List>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" onClick={save}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};

export default PageSettingsModulesCoreUpdater;
