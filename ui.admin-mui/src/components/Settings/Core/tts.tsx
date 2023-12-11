import { LoadingButton } from '@mui/lab';
import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { GooglePrivateKeysInterface } from '@sogebot/backend/dest/database/entity/google';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useRefElement } from 'rooks';

import getAccessToken from '../../../getAccessToken';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesCoreTTS: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const { settings, loading, refresh, save, saving, handleChange, setLoading } = useSettings('/core/tts');
  const { translate } = useTranslation();

  const [ privateKeys, setPrivateKeys ] = useState<GooglePrivateKeysInterface[]>([]);
  useEffect(() => {
    setLoading(true);
    axios.get(`${JSON.parse(localStorage.server)}/api/services/google/privatekeys`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => setPrivateKeys(response.data.data))
      .finally(refresh);
  }, [ refresh, setLoading ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (loading ? null : <Box ref={ref} id="tts">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.tts')}</Typography>

    <Typography variant='h5' sx={{ pb: 2 }}>ResponsiveVoice TTS</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <TextField
          sx={{ minWidth: 300 }}
          label={translate('integrations.responsivevoice.settings.key.title')}
          helperText={translate('integrations.responsivevoice.settings.key.help')}
          variant="filled"
          type="password"
          value={settings.responsiveVoiceKey[0]}
          onChange={(event) => handleChange('responsiveVoiceKey', event.target.value)}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ pb: 2 }}>Google TTS</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <FormControl  variant="filled" sx={{ minWidth: 300 }}>
          <InputLabel id="private-key-label" shrink>Google Private Key</InputLabel>
          <Select
            labelId="private-key-label"
            id="private-key-select"
            value={settings.googlePrivateKey[0]}
            label='Google Private Key'
            displayEmpty
            onChange={(event) => handleChange('googlePrivateKey', event.target.value)}
          >
            <MenuItem value={''}><em>None</em></MenuItem>
            {privateKeys.map(key => <MenuItem key={key.id} value={key.id}>
              <Typography component={'span'} fontWeight={'bold'}>{ key.clientEmail }</Typography>
              <Typography component={'span'} fontSize={12} pl={1}>{ key.id }</Typography>
            </MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesCoreTTS;
