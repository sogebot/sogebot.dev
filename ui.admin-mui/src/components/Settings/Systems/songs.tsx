import { LoadingButton } from '@mui/lab';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useRefElement } from 'rooks';

import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesSystemsSongs: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const validator = useMemo(() => ({
    'reminder.everyXMessages': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'duration': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
    ],
    'volume': [
      (value: string) => String(value).length > 0 || 'isNotEmpty',
      (value: string) => !isNaN(Number(value)) || 'isInt',
      (value: string) => Number(value) >= 0 || 'min|0',
      (value: string) => Number(value) <= 100 || 'max|100',
    ],
  }), []);

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, handleChange } = useSettings('/systems/songs' as any, validator);

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

  return (loading ? null : <Box ref={ref} id="songs">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.songs') }</Typography>

    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        {['songrequest', 'playlist', 'notify', 'shuffle', 'onlyMusicCategory', 'allowRequestsOnlyFromPlaylist', 'calculateVolumeByLoudness'].map(item => <FormGroup key={item}>
          <FormControlLabel
            control={<Checkbox checked={settings[item][0]} onChange={(_, checked) => handleChange(item, checked)} />}
            label={translate('systems.songs.settings.' + item)}
          />
        </FormGroup>,
        )}
        <TextField
          {...TextFieldProps('volume')}
          label={translate(`systems.songs.settings.volume`)}
          type="number"
        />
        <TextField
          {...TextFieldProps('duration')}
          InputProps={{ startAdornment: <InputAdornment position="start">{translate(`systems.songs.settings.duration.help`)}</InputAdornment> }}
          label={translate(`systems.songs.settings.duration.title`)}
        />
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsSongs;
