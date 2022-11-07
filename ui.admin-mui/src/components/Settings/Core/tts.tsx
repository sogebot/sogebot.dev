import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { GooglePrivateKeysInterface } from '@sogebot/backend/dest/database/entity/google';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import getAccessToken from '~/src/getAccessToken';
import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesCoreTTS: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const router = useRouter();
  const { settings, loading, refresh, save, saving, handleChange, setLoading } = useSettings('/core/tts');
  const { translate } = useTranslation();

  const [ privateKeys, setPrivateKeys ] = useState<GooglePrivateKeysInterface[]>([]);
  useEffect(() => {
    setLoading(true);
    axios.get(`${localStorage.server}/api/services/google/privatekeys`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => setPrivateKeys(response.data.data))
      .finally(refresh);
  }, [ router, refresh, setLoading ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (<Box ref={ref} id="tts">
    <Typography variant='h1' sx={{ pb: 2 }}>{translate('menu.tts')}</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <FormControl  variant="filled" sx={{ minWidth: 300 }}>
          <InputLabel id="demo-simple-select-label">{translate('core.tts.settings.service')}</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={settings.service[0]}
            label={translate('core.tts.settings.service')}
            onChange={(event) => handleChange('service', event.target.value)}
          >
            <MenuItem value={-1}>None</MenuItem>
            <MenuItem value={0}>ResponsiveVoice</MenuItem>
            <MenuItem value={1}>Google TTS</MenuItem>
          </Select>
        </FormControl>

        {settings.service[0] === 0
          && <TextField
            sx={{ minWidth: 300 }}
            label={translate('integrations.responsivevoice.settings.key.title')}
            helperText={translate('integrations.responsivevoice.settings.key.help')}
            variant="filled"
            type="password"
            value={settings.responsiveVoiceKey[0]}
            onChange={(event) => handleChange('responsiveVoiceKey', event.target.value)}
          />
        }

        {settings.service[0] === 1
          && <FormControl  variant="filled" sx={{ minWidth: 300 }}>
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
        }
      </Stack>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};

export default PageSettingsModulesCoreTTS;
