import { LoadingButton } from '@mui/lab';
import { Alert, Box, Button, Checkbox, FormControlLabel, FormGroup, Paper, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useConfirm } from 'material-ui-confirm';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import { useRefElement } from 'rooks';

import getAccessToken from '../../../getAccessToken';
import { dayjs } from '../../../helpers/dayjsHelper';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { PermissionTabs } from '../PermissionTabs';

const PageSettingsModulesSystemsPoints: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'customization.name': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'reset.resetIntervalCron': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    '__permission_based__.customization.interval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.customization.perInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.customization.offlineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.customization.perOfflineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.customization.messageInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.customization.perMessageInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.customization.messageOfflineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.customization.perMessageOfflineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, handleChange, handleChangePermissionBased, getPermissionSettingsValue, TextFieldProps } = useSettings('/systems/points' as any, validator);

  const [cronIntervals, setCronIntervals] = useState<number[]>([]);
  const [cronError, setCronError] = useState('');
  const confirm = useConfirm();
  const { enqueueSnackbar } = useSnackbar();

  const manuallyResetPoints = React.useCallback(() => {
    confirm({ description: 'This action is permanent!' })
      .then(() => {
        axios.post(`/api/systems/points/reset`, undefined, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        })
          .then(() => {
            enqueueSnackbar('User points were reset.', { variant: 'success' });
          });
      }).catch(() => {});
  }, [confirm]);

  useEffect(() => {
    if (settings?.reset.resetIntervalCron) {
      axios.post(`/api/systems/points/cron`, { cron: settings.reset.resetIntervalCron[0] }, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      })
        .then(({ data }) => {
          setCronError('');
          setCronIntervals(data.data);
        })
        .catch(e => {
          console.error(e);
          setCronError(e.response.data.errors);
          setCronIntervals([]);
        });
    }
  }, [settings]);

  useEffect(() => {
    refresh();
  }, [ ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="points">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.points') }</Typography>

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.customization') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('customization.name', { helperText: translate('systems.points.settings.name.help') })}
          label={translate('systems.points.settings.name.title')}
        />

        <PermissionTabs settings={settings} errors={errors} handleChangePermissionBased={handleChangePermissionBased} getPermissionSettingsValue={getPermissionSettingsValue} ignoredPermissionsCategory='customization'>
          {({ TextFieldProps: TextFieldPropsTabs }) => <Stack spacing={1}>
            { [
              'interval', 'perInterval', 'offlineInterval',
              'perOfflineInterval', 'messageInterval', 'perMessageInterval',
              'messageOfflineInterval', 'perMessageOfflineInterval',
            ].map(item => <TextField
              key={item}
              {...TextFieldPropsTabs('customization.' + item)}
              type='number'
              label={translate('systems.points.settings.' + item)}
            />,
            )}
          </Stack>
          }
        </PermissionTabs>
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.reset') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.reset.isPointResetIntervalEnabled[0]} onChange={(_, checked) => handleChange('reset.isPointResetIntervalEnabled', checked)} />} label={translate('systems.points.settings.isPointResetIntervalEnabled')} />
        </FormGroup>
        <TextField
          {...TextFieldProps('reset.resetIntervalCron', { helperText: translate('systems.points.settings.resetIntervalCron.help') })}
          label={translate('systems.points.settings.resetIntervalCron.name')}
        />

        { cronIntervals.map(timestamp => <Typography key={timestamp}>{ dayjs(timestamp).format('LL LTS') }</Typography>) }

        {cronError.length > 0 && <Alert variant="filled" severity='error' >{ cronError }</Alert>}
      </Stack>

      <Button sx={{ mt: 1 }} color='error' onClick={manuallyResetPoints}>Manually reset points</Button>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0 || cronError !== ''}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsPoints;
