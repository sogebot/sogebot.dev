import { LoadingButton, Skeleton } from '@mui/lab';
import { Alert, Box, List, ListItem, Paper, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useRefElement } from 'rooks';

import getAccessToken from '../../../getAccessToken';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';
import { PermissionTabs } from '../PermissionTabs';

const PageSettingsModulesSystemsLevels: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'conversion.conversionRate': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 1 || 'min|1',
    ],
    'levels.firstLevelStartsAt': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 1 || 'min|1',
    ],
    'levels.nextLevelFormula': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    'xp.xpName': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
    ],
    '__permission_based__.xp.interval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.xp.perInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.xp.offlineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.xp.perOfflineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.xp.messageInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.xp.perMessageInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.xp.messageOfflineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.xp.perMessageOfflineInterval': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, handleChange, TextFieldProps, errors, getPermissionSettingsValue, handleChangePermissionBased } = useSettings('/systems/levels' as any, validator);

  const [ showcase, setShowcase ] = useState<null | string[] | string>(null);

  useEffect(() => {
    if (settings) {
      setShowcase(null);
      axios.post('/api/systems/levels/example',  {
        firstLevelStartsAt: settings.levels.firstLevelStartsAt[0], nextLevelFormula: settings.levels.nextLevelFormula[0], xpName: settings.xp.xpName[0],
      }, { headers: { authorization: `Bearer ${getAccessToken()}` } })
        .then(({ data }) => {
          if (data.status === 'success') {
            setShowcase(data.data);
          } else {
            setShowcase(data.errors);
          }
        }).catch((err) => {
          setShowcase(err.response.data.errors);
        });
    }
  }, [ settings ]);

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

  return (loading ? null : <Box ref={ref} id="levels">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.levels') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('xp.xpName')}
          variant='filled'
          fullWidth
          value={settings.xp.xpName[0]}
          label={translate('systems.levels.settings.xpName')}
          onChange={(event) => handleChange('xp.xpName', event.target.value)}
        />
        <TextField
          {...TextFieldProps('conversion.conversionRate')}
          variant='filled'
          fullWidth
          type='number'
          value={settings.conversion.conversionRate[0]}
          label={translate('systems.levels.settings.conversionRate')}
          onChange={(event) => handleChange('conversion.conversionRate', event.target.value)}
        />
        <TextField
          {...TextFieldProps('levels.firstLevelStartsAt')}
          variant='filled'
          fullWidth
          type='number'
          value={settings.levels.firstLevelStartsAt[0]}
          label={translate('systems.levels.settings.firstLevelStartsAt')}
          onChange={(event) => handleChange('levels.firstLevelStartsAt', event.target.value)}
        />
        <TextField
          {...TextFieldProps('levels.nextLevelFormula')}
          helperText={TextFieldProps('levels.nextLevelFormula').helperText ?? translate('systems.levels.settings.nextLevelFormula.help')}
          variant='filled'
          fullWidth
          value={settings.levels.nextLevelFormula[0]}
          label={translate('systems.levels.settings.nextLevelFormula.title')}
          onChange={(event) => handleChange('levels.nextLevelFormula', event.target.value)}
        />

        { !showcase && <List sx={{ columnCount: 3 }}>
          {[...Array(20)].map((_, i) =>
            <ListItem key={i}><Skeleton width='100%'/></ListItem>,
          )}
        </List>}
        { showcase && typeof showcase === 'string' && <Alert color='error'>{showcase}</Alert>}
        { showcase && Array.isArray(showcase) && <List sx={{ columnCount: 3 }}>
          {showcase.map((xp, i) =>
            <ListItem key={i} sx={{ justifyContent: 'space-between' }}>
              <Typography><strong>{i+ 1}</strong></Typography>
              <Typography>{xp}</Typography>
            </ListItem>,
          )}
        </List>}

        <PermissionTabs settings={settings} errors={errors} ignoredPermissionsCategory='xp' getPermissionSettingsValue={getPermissionSettingsValue} handleChangePermissionBased={handleChangePermissionBased}>
          {({ TextFieldProps: TextFieldPropsTab }) => <Stack spacing={1}>
            {[
              'interval', 'perInterval', 'offlineInterval', 'perOfflineInterval', 'messageInterval',
              'perMessageInterval', 'messageOfflineInterval', 'perMessageOfflineInterval',
            ].map(key => <TextField
              key={key}
              {...TextFieldPropsTab('xp.' + key)}
              type='number'
              label={translate('systems.levels.settings.' + key)}
            />)}
          </Stack>}
        </PermissionTabs>
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsLevels;
