import { LoadingButton } from '@mui/lab';
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { SettingsSystemsDialogStringArray } from '~/src/components/Settings/Dialog/StringArray';
import { PermissionTabs } from '~/src/components/Settings/PermissionTabs';
import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesSystemsModeration: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'warnings.cWarningsAllowedCount': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    '__permission_based__.lists.cListsTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 1 || 'min|1',
    ],
    '__permission_based__.caps_filter.cCapsMaxCapsPercent': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
      (value: string) => Number(value) <= 100 || 'max|100',
    ],
    '__permission_based__.caps_filter.cCapsTriggerLength': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.caps_filter.cCapsTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.color_filter.cColorTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.emotes_filter.cEmotesTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.emotes_filter.cEmotesMaxCount': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.links_filter.cLinksTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.longMessage_filter.cLongMessageTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.spam_filter.cSpamTriggerLength': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.spam_filter.cSpamMaxLength': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.spam_filter.cSpamTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.symbols_filter.cSymbolsTriggerLength': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.symbols_filter.cSymbolsMaxSymbolsConsecutively': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.symbols_filter.cSymbolsMaxSymbolsPercent': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
    '__permission_based__.symbols_filter.cSymbolsTimeout': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|1',
    ],
  }), []);

  const router = useRouter();
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, handleChange, handleChangePermissionBased, getPermissionSettingsValue, TextFieldProps } = useSettings('/systems/moderation' as any, validator);

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

  return (loading ? null : <Box ref={ref} id="moderation">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.moderation') }</Typography>

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.warnings') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('warnings.cWarningsAllowedCount')}
          type='number'
          label={translate('systems.moderation.settings.cWarningsAllowedCount')}
        />
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.warnings.cWarningsAnnounceTimeouts[0]} onChange={(_, checked) => handleChange('warnings.cWarningsAnnounceTimeouts', checked)} />} label={translate('systems.moderation.settings.cWarningsAnnounceTimeouts')} />
        </FormGroup>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.warnings.cWarningsShouldClearChat[0]} onChange={(_, checked) => handleChange('warnings.cWarningsShouldClearChat', checked)} />} label={translate('systems.moderation.settings.cWarningsShouldClearChat')} />
        </FormGroup>
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.lists') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <Grid container alignItems='center'>
          <Grid item>
            <Typography>{ translate('systems.moderation.settings.autobanMessages') }</Typography>
          </Grid>
          <Grid item sx={{ pl: 2 }}>
            <SettingsSystemsDialogStringArray title={translate('systems.moderation.settings.autobanMessages')} items={settings.lists.autobanMessages[0]} onChange={(value) => handleChange('lists.autobanMessages', value)} />
          </Grid>
        </Grid>
        <Grid container alignItems='center'>
          <Grid item>
            <Typography>{ translate('systems.moderation.settings.cListsBlacklist') }</Typography>
          </Grid>
          <Grid item sx={{ pl: 2 }}>
            <SettingsSystemsDialogStringArray title={translate('systems.moderation.settings.cListsBlacklist')} items={settings.lists.cListsBlacklist[0]} onChange={(value) => handleChange('lists.cListsBlacklist', value)} />
          </Grid>
        </Grid>
        <Grid container alignItems='center'>
          <Grid item>
            <Typography>{ translate('systems.moderation.settings.cListsWhitelist.title') }</Typography>
          </Grid>
          <Grid item sx={{ pl: 2 }}>
            <SettingsSystemsDialogStringArray title={translate('systems.moderation.settings.cListsWhitelist.title')} items={settings.lists.cListsWhitelist[0]} onChange={(value) => handleChange('lists.cListsWhitelist', value)} />
          </Grid>
        </Grid>
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.rules') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <PermissionTabs settings={settings} errors={errors} handleChangePermissionBased={handleChangePermissionBased} getPermissionSettingsValue={getPermissionSettingsValue} ignoredPermissionsCategory='lists'>
          {({ TextFieldProps: TextFieldPropsTabs, CheckBox }) => <Stack spacing={1}>
            <Typography variant='h6'>{ translate('categories.lists') }</Typography>
            { CheckBox('lists.cListsEnabled', { label: translate('systems.moderation.settings.cWarningsShouldClearChat') }) }
            <TextField
              {...TextFieldPropsTabs('lists.cListsTimeout')}
              type='number'
              label={translate('systems.moderation.settings.cListsTimeout')}
            />

            <Divider sx={{ margin: '30px 0 15px 0px !important' }}/>

            <Typography variant='h6'>{ translate('categories.caps_filter') }</Typography>
            { CheckBox('caps_filter.cCapsEnabled', { label: translate('systems.moderation.settings.cCapsEnabled') }) }
            {['cCapsMaxCapsPercent', 'cCapsTriggerLength', 'cCapsTimeout'].map(key =>
              <TextField
                key={key}
                {...TextFieldPropsTabs('caps_filter.' + key)}
                type='number'
                label={translate('systems.moderation.settings.' + key)}
              />
            )}

            <Divider sx={{ margin: '30px 0 15px 0px !important' }}/>

            <Typography variant='h6'>{ translate('categories.color_filter') }</Typography>
            { CheckBox('color_filter.cColorEnabled', { label: translate('systems.moderation.settings.cCapsEnabled') }) }
            {['cColorTimeout'].map(key =>
              <TextField
                key={key}
                {...TextFieldPropsTabs('color_filter.' + key)}
                type='number'
                label={translate('systems.moderation.settings.' + key)}
              />
            )}

            <Divider sx={{ margin: '30px 0 15px 0px !important' }}/>

            <Typography variant='h6'>{ translate('categories.emotes_filter') }</Typography>
            { CheckBox('emotes_filter.cEmotesEnabled', { label: translate('systems.moderation.settings.cCapsEnabled') }) }
            {['cEmotesMaxCount', 'cEmotesTimeout'].map(key =>
              <TextField
                key={key}
                {...TextFieldPropsTabs('emotes_filter.' + key)}
                type='number'
                label={translate('systems.moderation.settings.' + key)}
              />
            )}

            <Divider sx={{ margin: '30px 0 15px 0px !important' }}/>

            <Typography variant='h6'>{ translate('categories.links_filter') }</Typography>
            { CheckBox('links_filter.cLinksEnabled', { label: translate('systems.moderation.settings.cCapsEnabled') }) }
            { CheckBox('links_filter.cLinksIncludeClips', { label: translate('systems.moderation.settings.cLinksIncludeClips') }) }
            { CheckBox('links_filter.cLinksIncludeSpaces', { label: translate('systems.moderation.settings.cLinksIncludeSpaces') }) }
            {['cLinksTimeout'].map(key =>
              <TextField
                key={key}
                {...TextFieldPropsTabs('links_filter.' + key)}
                type='number'
                label={translate('systems.moderation.settings.' + key)}
              />
            )}

            <Divider sx={{ margin: '30px 0 15px 0px !important' }}/>

            <Typography variant='h6'>{ translate('categories.longMessage_filter') }</Typography>
            { CheckBox('longMessage_filter.cLongMessageEnabled', { label: translate('systems.moderation.settings.cCapsEnabled') }) }
            {['cLongMessageTimeout'].map(key =>
              <TextField
                key={key}
                {...TextFieldPropsTabs('longMessage_filter.' + key)}
                type='number'
                label={translate('systems.moderation.settings.' + key)}
              />
            )}

            <Divider sx={{ margin: '30px 0 15px 0px !important' }}/>

            <Typography variant='h6'>{ translate('categories.spam_filter') }</Typography>
            { CheckBox('spam_filter.cSpamEnabled', { label: translate('systems.moderation.settings.cCapsEnabled') }) }
            {['cSpamTriggerLength', 'cSpamMaxLength', 'cSpamTimeout'].map(key =>
              <TextField
                key={key}
                {...TextFieldPropsTabs('spam_filter.' + key)}
                type='number'
                label={translate('systems.moderation.settings.' + key)}
              />
            )}

            <Divider sx={{ margin: '30px 0 15px 0px !important' }}/>

            <Typography variant='h6'>{ translate('categories.symbols_filter') }</Typography>
            { CheckBox('symbols_filter.cSymbolsEnabled', { label: translate('systems.moderation.settings.cCapsEnabled') }) }
            {['cSymbolsTriggerLength', 'cSymbolsMaxSymbolsConsecutively', 'cSymbolsMaxSymbolsPercent', 'cSymbolsTimeout'].map(key =>
              <TextField
                key={key}
                {...TextFieldPropsTabs('symbols_filter.' + key)}
                type='number'
                label={translate('systems.moderation.settings.' + key)}
              />
            )}
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

export default PageSettingsModulesSystemsModeration;
