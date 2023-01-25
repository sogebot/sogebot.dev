import { ExpandMoreTwoTone, PlayArrowTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, FormControl, FormLabel, IconButton, InputLabel, Link, MenuItem, Paper, Select, Slider, Stack, Switch, Typography,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { AlertInterface, CommonSettingsInterface } from '@sogebot/backend/dest/database/entity/alert';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useSelector } from 'react-redux';

import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: Randomizer['tts'],
  open: string,
  onClick: (value: string) => void;
  onChange: (value: Randomizer['tts']) => void;
};

function isGlobal (value: Partial<CommonSettingsInterface['tts']> | Required<AlertInterface['tts']>): value is Required<AlertInterface['tts']> {
  if (value) {
    return Object.keys(value).includes('voice');
  } else {
    return false;
  }
}

export const AccordionTTS: React.FC<Props> = (props) => {
  const accordionId = 'tts';
  const { open,
    onClick,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();
  const { configuration } = useSelector((state: any) => state.loader);

  const service = React.useMemo(() => configuration.core.tts.service as -1 | 0 | 1, [ configuration ]);
  const [ voices, setVoices ] = React.useState<string[]>([]);
  const [ text, setText ] = React.useState('This message should be said by TTS to test your settings.');
  const isConfigured = React.useMemo(() => {
    if (configuration.core.tts.service === -1
      || (configuration.core.tts.service === 0 && configuration.core.tts.responsiveVoiceKey.length === 0)
      || (configuration.core.tts.service === 1 && (configuration.core.tts.googlePrivateKey.length === 0))) {
      return false;
    }
    return true;
  }, [ configuration]);

  const handleClick = () => {
    onClick(open === accordionId ? '' : accordionId);
  };

  const getVoicesFromResponsiveVoice = () => {
    if (typeof window.responsiveVoice === 'undefined') {
      setTimeout(() => getVoicesFromResponsiveVoice(), 200);
      return;
    }
    window.responsiveVoice.init();
    setVoices(window.responsiveVoice.getVoices().map((o: { name: string }) => o.name));
  };

  React.useEffect(() => {
    if (open === 'tts') {
      if (service === 0) {
        getVoicesFromResponsiveVoice();
      }
      if (service === 1) {
        setVoices(configuration.core.tts.googleVoices);
      }
    }
  }, [open, service, configuration]);

  const speak = React.useCallback(async () => {
    for (const toSpeak of text.split('/ ')) {
      await new Promise<void>((resolve) => {
        if (toSpeak.trim().length === 0) {
          setTimeout(() => resolve(), 500);
        } else {
          if (isGlobal(model) && model) {
            if (service === 0) {
              window.responsiveVoice.speak(toSpeak.trim(), model.voice, {
                rate: model.rate, pitch: model.pitch, volume: model.volume, onend: () => setTimeout(() => resolve(), 500),
              });
            } else {
              // Google TTS
              getSocket('/core/tts').emit('google::speak', {
                rate: model.rate, pitch: model.pitch, volume: model.volume, voice: model.voice, text: text,
              }, (err, b64mp3) => {
                if (err) {
                  console.error(err);
                }
                const snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
                snd.play();
              });
            }
          } else {
            console.error('You should not see this message, speak should be disabled in this extension panel - please log a bug');
          }
        }
      });
    }
  }, [ text, service, model ]);

  return <>
    <Helmet>
      {configuration.core.tts.responsiveVoiceKey.length > 0 && <script src={`https://code.responsivevoice.org/responsivevoice.js?key=${configuration.core.tts.responsiveVoiceKey}`}></script>}
    </Helmet>
    <Accordion {...accordionProps} disabled={props.disabled || !isConfigured} expanded={open === accordionId && !props.disabled && isConfigured}>
      <AccordionSummary
        expandIcon={<ExpandMoreTwoTone />}
        onClick={() => handleClick()}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        {isConfigured && <>
          {model.enabled !== undefined && <Switch
            size='small'
            sx={{ mr: 1 }}
            checked={model.enabled}
            onClick={ev => ev.stopPropagation()}
            onChange={(_, val) => onChange({
              ...model, enabled: val,
            }) }/>}
        </>}
        <Typography>{ translate('registry.alerts.tts.setting') }</Typography>

        {!isConfigured && <Paper sx={{
          color: theme.palette.error.light, marginLeft: 'auto', px: 1, mr: 1,
        }} elevation={0}>
        TTS is not properly set, go to{' '}<Link href="/settings/modules/core/tts">{' '}TTS settings</Link> and configure.
        </Paper>}
      </AccordionSummary>
      <AccordionDetails>
        {model.voice !== undefined && <FormControl fullWidth variant="filled" >
          <InputLabel id="type-select-label">{translate('registry.alerts.voice')}</InputLabel>
          <Select
            MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
            label={translate('registry.alerts.voice')}
            labelId="type-select-label"
            value={model.voice}
            onChange={(ev) => onChange({
              ...model, voice: ev.target.value as typeof model.voice,
            })}
          >
            {voices.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
          </Select>
        </FormControl>}

        <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '30px 20px 0px 0' }}>
          <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.volume') }</FormLabel>
          <Slider
            step={0.01}
            min={0}
            max={1}
            valueLabelFormat={(val) => `${Number(val * 100).toFixed(0)}%`}
            valueLabelDisplay="on"
            value={model.volume}
            onChange={(_, newValue) => onChange({
              ...model, volume: newValue as number,
            })}/>
        </Stack>

        <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 0px 0' }}>
          <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.rate') }</FormLabel>
          <Slider
            step={0.01}
            min={0}
            max={service === 0 ? 1.5 : 4.0}
            valueLabelDisplay="on"
            value={model.rate}
            onChange={(_, newValue) => onChange({
              ...model, rate: newValue as number,
            })}/>
        </Stack>

        <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 30px 0' }}>
          <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.pitch') }</FormLabel>
          <Slider
            step={service === 0 ? 0.1 : 1}
            min={service === 0 ? 0.0 : -20.0}
            max={service === 0 ? 2.0 : 20.0}
            valueLabelDisplay="on"
            value={model.pitch}
            onChange={(_, newValue) => onChange({
              ...model, pitch: newValue as number,
            })}/>
        </Stack>

        {model.voice !== undefined && <TextField
          value={text}
          variant='filled'
          fullWidth
          label={translate('registry.alerts.test')}
          onChange={(ev) => setText(ev.currentTarget.value)}
          InputProps={{ endAdornment: <IconButton onClick={speak}><PlayArrowTwoTone/></IconButton> }}
        />}
      </AccordionDetails>
    </Accordion>
  </>;
};