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
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { PermissionTabs } from '~/src/components/Settings/PermissionTabs';
import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesSystemsCooldown: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    '__permission_based__.default.defaultCooldownOfCommandsInSeconds': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.default.defaultCooldownOfKeywordsInSeconds': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
  }), []);

  const router = useRouter();
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, handleChange, handleChangePermissionBased, getPermissionSettingsValue } = useSettings('/systems/cooldown' as any, validator);

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

  return (<Box ref={ref} id="cooldown">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.cooldown') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.cooldownNotifyAsWhisper[0]} onChange={(_, checked) => handleChange('cooldownNotifyAsWhisper', checked)} />} label={translate('systems.cooldown.settings.cooldownNotifyAsWhisper')} />
      </FormGroup>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.cooldownNotifyAsChat[0]} onChange={(_, checked) => handleChange('cooldownNotifyAsChat', checked)} />} label={translate('systems.cooldown.settings.cooldownNotifyAsChat')} />
      </FormGroup>

      <PermissionTabs settings={settings} errors={errors} handleChangePermissionBased={handleChangePermissionBased} getPermissionSettingsValue={getPermissionSettingsValue}>
        {({ TextFieldProps }) => <Stack spacing={1}>
          <TextField
            {...TextFieldProps('default.defaultCooldownOfCommandsInSeconds')}
            type='number'
            label={translate('systems.cooldown.settings.defaultCooldownOfCommandsInSeconds')}
          />
          <TextField
            {...TextFieldProps('default.defaultCooldownOfKeywordsInSeconds')}
            type='number'
            label={translate('systems.cooldown.settings.defaultCooldownOfKeywordsInSeconds')}
          />
        </Stack>}
      </PermissionTabs>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};

export default PageSettingsModulesSystemsCooldown;