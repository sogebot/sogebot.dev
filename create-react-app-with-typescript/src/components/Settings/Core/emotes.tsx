import { LoadingButton } from '@mui/lab';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesCoreEmotes: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/core/emotes');
  const { translate } = useTranslation();

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="emotes">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.emotes')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.bttv[0]} onChange={(_, checked) => handleChange('bttv', checked)} />} label="BetterTTV" />
      </FormGroup>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={settings.ffz[0]} onChange={(_, checked) => handleChange('ffz', checked)} />} label="FrankenFaceZ" />
      </FormGroup>

      <TextField
        fullWidth
        label='7TV emote set'
        helperText='7TV is enabled when input is populated. Login into https://7tv.app/ and paste your emote-sets url like https://7tv.app/emote-sets/<id>'
        variant="filled"
        value={settings['7tvEmoteSet'][0]}
        placeholder='https://7tv.app/emote-sets/<id>'
        onChange={(event) => handleChange('7tvEmoteSet', event.target.value)}
      />
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesCoreEmotes;
