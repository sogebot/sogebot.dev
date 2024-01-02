import { LoadingButton } from '@mui/lab';
import { Box, Paper, Stack, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useRefElement } from 'rooks';

import { TTSElevenLabs } from './tts/elevenlabs';
import { TTSGoogle } from './tts/google';
import { TTSResponsiveVoice } from './tts/responsivevoice';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const PageSettingsModulesCoreTTS: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const { settings, loading, save, saving, handleChange, refresh } = useSettings('/core/tts');
  const { translate } = useTranslation();

  React.useEffect(() => {
    console.log('loading', loading);
  }, [ loading ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector(state => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  return (loading ? null : <Box ref={ref} id="tts">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.tts')}</Typography>

    <Typography variant='h5' sx={{ pb: 2 }}>ResponsiveVoice TTS</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <TTSResponsiveVoice handleChange={handleChange} settings={settings}/>
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ pb: 2 }}>Google TTS</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <TTSGoogle handleChange={handleChange} settings={settings}/>
      </Stack>
    </Paper>
    }

    <Typography variant='h5' sx={{ pb: 2 }}>ElevenLabs</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <TTSElevenLabs handleChange={handleChange} settings={settings}/>
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
